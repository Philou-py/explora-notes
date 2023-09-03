import { useState, useMemo, useEffect } from "react";
import { Copy } from "./CopyDialog";
import { Scale } from "./StudentMarksTable";
import Card, { CardHeader, CardContent, CardActions } from "@/components/Card";
import Form from "@/components/Form";
import InputField from "@/components/InputField";
import Button from "@/components/Button";
import Spacer from "@/components/Spacer";
import { roundNum } from "@/helpers/roundNum";
import cn from "classnames/bind";
import copyFormStyles from "./CopyForm.module.scss";
import { useHandleMutation } from "@/app/useHandleMutation";
import { useParams } from "next/navigation";

const cx = cn.bind(copyFormStyles);

interface Props {
  copy: Copy;
  scale: Scale;
  criteriaToObserve: string[];
  studentId: string;
  studentName: string;
  actionType: string;
  closeDialog: () => void;
}

export default function CopyForm({
  copy,
  scale,
  criteriaToObserve,
  studentId,
  studentName,
  actionType,
  closeDialog,
}: Props) {
  const { teacherEmail, groupId, evalId } = useParams();
  const { submitAction, isLoading } = useHandleMutation(closeDialog);

  const [bonusPoints, setBonusPoints] = useState(0);
  const [penaltyPoints, setPenaltyPoints] = useState(0);
  const [catRes, setCatRes] = useState(copy.categoryResults);
  const [removeBtns, setRemoveBtns] = useState(false);

  useEffect(() => {
    setCatRes(copy.categoryResults);
    setBonusPoints(copy.bonusPoints);
    setPenaltyPoints(copy.penaltyPoints);
    setRemoveBtns(false);
    if (actionType === "editCopy") {
      setRemoveBtns(true);
    }
  }, [copy, actionType]);

  const totalPoints = useMemo(() => {
    const categoryPoints = catRes.reduce(
      (sum, catRes) => (catRes.points === -1 ? sum : sum + catRes.points),
      0
    );
    return categoryPoints + bonusPoints - penaltyPoints;
  }, [catRes, bonusPoints, penaltyPoints]);

  const mark = useMemo(() => (totalPoints * 20) / scale.totalPoints, [totalPoints, scale]);

  const areAllChecked = useMemo(
    () => catRes.every((c) => c.criterionResults.every((d) => d.points !== -2)),
    [catRes]
  );

  const giveAllPoints = () => {
    const newCatRes = catRes.map((c, cI) => ({
      ...c,
      points: scale.categories[cI].maxPoints,
      criterionResults: c.criterionResults.map((d, dI) => ({
        ...d,
        points: scale.categories[cI].criteria[dI].maxPoints,
      })),
    }));
    setCatRes(newCatRes);
    setRemoveBtns(true);
  };

  const giveNoPoints = () => {
    const newCatRes = catRes.map((c) => ({
      ...c,
      points: 0,
      criterionResults: c.criterionResults.map((d) => ({ ...d, points: 0 })),
    }));
    setCatRes(newCatRes);
    setRemoveBtns(true);
  };

  const handleSelectNA = (catIndex: number, critIndex: number) => {
    let oldPoints = catRes[catIndex].criterionResults[critIndex].points;
    if (oldPoints === -2 || oldPoints === -1) oldPoints = 0;
    const newCatRes = catRes.map((c, cI) =>
      cI === catIndex
        ? {
            ...c,
            points: c.points - oldPoints,
            criterionResults: c.criterionResults.map((d, dI) =>
              dI === critIndex ? { ...d, points: -1 } : d
            ),
          }
        : c
    );
    setCatRes(newCatRes);
    setRemoveBtns(true);
  };

  const handleSelectPoints = (catIndex: number, critIndex: number, points: number) => {
    let oldPoints = catRes[catIndex].criterionResults[critIndex].points;
    if (oldPoints === -2 || oldPoints === -1) oldPoints = 0;
    const newCatRes = catRes.map((c, cI) =>
      cI === catIndex
        ? {
            ...c,
            points: c.points - oldPoints + points,
            criterionResults: c.criterionResults.map((d, dI) =>
              dI === critIndex ? { ...d, points } : d
            ),
          }
        : c
    );
    setCatRes(newCatRes);
    setRemoveBtns(true);
  };

  const resultsTemplate =
    catRes.length !== 0 &&
    scale.categories.map((cat, catIndex) => (
      <div key={cat.id} className={cx("category")}>
        <p className={cx("categoryLabel")}>{cat.label}</p>
        {cat.criteria.map(
          (crit, critIndex) =>
            (!copy.shouldObserve || criteriaToObserve.includes(crit.id)) && (
              <div key={crit.id}>
                <p className={cx("criterionLabel")}>{crit.label}</p>
                <div className={cx("radioButtonsContainer")}>
                  <div className={cx("radioButton")}>
                    <label>
                      <input
                        type="radio"
                        name={`cat-${cat.id}-crit-${crit.id}`}
                        value="NA"
                        checked={catRes[catIndex].criterionResults[critIndex].points === -1}
                        onChange={() => handleSelectNA(catIndex, critIndex)}
                        required
                      />
                      N/T
                    </label>
                  </div>
                  {[
                    ...Array(
                      scale.categories[catIndex].criteria[critIndex].maxPoints /
                        scale.markPrecision +
                        1
                    ).keys(),
                  ]
                    .map((i) => i * scale.markPrecision)
                    .map((i) => (
                      <div key={`crit-${crit.id}-${i}`} className={cx("radioButton")}>
                        <label>
                          <input
                            type="radio"
                            name={`cat-${cat.id}-crit-${crit.id}`}
                            value={i}
                            checked={i === catRes[catIndex].criterionResults[critIndex].points}
                            onChange={() => handleSelectPoints(catIndex, critIndex, i)}
                            required
                          />
                          {i}
                        </label>
                      </div>
                    ))}
                </div>
              </div>
            )
        )}
        <p className={cx("categorySummary")}>
          Points obtenus à {cat.label} : {catRes[catIndex].points} /{" "}
          {scale.categories[catIndex].maxPoints}
        </p>
      </div>
    ));

  return (
    <Card className={cx("copyCard")}>
      <Form
        onSubmit={() =>
          submitAction(
            `/teacher/${teacherEmail}/group/${groupId}/evaluation/${evalId}/${
              copy.id ? "update" : "create"
            }-copy`,
            "POST",
            {
              copyId: copy.id,
              studentId,
              categoryResults: catRes,
              summary: { totalPoints, mark, bonusPoints, penaltyPoints },
            }
          )
        }
      >
        <CardHeader
          title={<h2>{actionType === "editCopy" ? "Modifier une copie" : "Ajouter une copie"}</h2>}
          centerTitle
        />

        <CardContent>
          <p className={cx("studentInQuestion")}>Élève : {studentName}</p>
          {!copy.shouldObserve && !removeBtns && (
            <>
              <div className={cx("preselectControls")}>
                <Button
                  type="text"
                  className="teal--text"
                  prependIcon="done_all"
                  onClick={giveAllPoints}
                >
                  Note max
                </Button>
                <Button
                  type="text"
                  className="purple--text text--lighten-1"
                  prependIcon="block"
                  onClick={giveNoPoints}
                >
                  Copie blanche
                </Button>
              </div>
            </>
          )}
          <Spacer />
          {resultsTemplate}
          <div className={cx("bonusPenalty")}>
            <InputField
              type="select"
              label="Points bonus"
              prependIcon="add_circle"
              selectItems={[
                ["0", "0"],
                ["0.5", "0.5"],
                ["1", "1"],
                ["1.5", "1.5"],
                ["2", "2"],
              ]}
              setValue={(newVal) => setBonusPoints(Number(newVal))}
              value={bonusPoints.toString()}
            />
            <InputField
              type="select"
              label="Points malus"
              prependIcon="cancel"
              selectItems={[
                ["0", "0"],
                ["0.5", "0.5"],
                ["1", "1"],
                ["1.5", "1.5"],
                ["2", "2"],
              ]}
              setValue={(newVal) => setPenaltyPoints(Number(newVal))}
              value={penaltyPoints.toString()}
            />
          </div>
          <p>
            Note : {totalPoints + penaltyPoints - bonusPoints}{" "}
            {bonusPoints !== 0 && `+ ${bonusPoints} `}
            {penaltyPoints !== 0 && `- ${penaltyPoints} `}/ {scale.totalPoints}
            {scale.totalPoints !== 20 && ` | Note sur 20 : ${roundNum(mark, 2)} / 20`}
          </p>
        </CardContent>

        <CardActions>
          <Spacer />
          <Button className="red--text mr-4" type="outlined" onClick={closeDialog}>
            Annuler
          </Button>
          <Button
            type="elevated"
            className="blue darken-3"
            isDisabled={!areAllChecked}
            isLoading={isLoading}
            formSubmit
          >
            Valider
          </Button>
        </CardActions>
      </Form>
    </Card>
  );
}
