import { useContext, useEffect, useMemo, useState } from "react";
import { EvalTemplate } from "../../../template/[templateId]/get-template/route";
import InputField from "@/components/InputField";
import Button from "@/components/Button";
import cn from "classnames/bind";
import createEvalScaleStyles from "./CreateEvalScale.module.scss";
import { SideBarContext } from "@/contexts/SideBarContext";

const cx = cn.bind(createEvalScaleStyles);

let counter = 0;

function incrementLabel(label: string) {
  const found = label.match(/\d+/);
  if (!found) return label;
  else
    return (
      label.slice(0, found.index) +
      (Number(found[0]) + 1) +
      label.slice(found.index + found[0].length)
    );
}

interface Props {
  markPrecision: number;
  categories: EvalTemplate["categories"];
}

export default function CreateEvalScale({ markPrecision, categories }: Props) {
  const [scale, setScale] = useState<EvalTemplate["categories"]>([]);
  const [nbCategories, setNbCategories] = useState(0);
  const [nbCriteria, setNbCriteria] = useState(0);
  const totalPoints = useMemo(
    () => scale.reduce((nbPoints, cat) => nbPoints + cat.maxPoints, 0),
    [scale]
  );
  const { setCEDialogOpen } = useContext(SideBarContext);

  useEffect(() => {
    if (categories.length !== 0) {
      setNbCategories(categories.length);
      setNbCriteria(categories.reduce((nbCriteria, cat) => nbCriteria + cat.criteria.length, 0));
      setScale(
        // Add unique IDs
        categories.map((cat) => ({
          ...cat,
          id: counter++,
          criteria: cat.criteria.map((crit) => ({ ...crit, id: counter++ })),
        }))
      );
      setCEDialogOpen(true);
    }
  }, [categories, setCEDialogOpen]);

  const handleAddCriterion = (catId: number, critId: number) => {
    const newScale = scale.map((category) => {
      if (category.id === catId) {
        const fromCritIndex = category.criteria.findIndex((crit) => crit.id === critId);
        const fromCrit = category.criteria[fromCritIndex];
        const newCriterion = {
          ...fromCrit,
          id: counter++,
          label: incrementLabel(fromCrit.label),
          maxPoints: 1,
        };
        return {
          ...category,
          maxPoints: category.maxPoints + 1,
          criteria: [
            ...category.criteria.slice(0, fromCritIndex + 1),
            newCriterion,
            ...category.criteria.slice(fromCritIndex + 1),
          ],
        };
      } else return category;
    });
    setScale(newScale);
    setNbCriteria((oldNb) => oldNb + 1);
  };

  const handleSetMaxPoints = (catId: number, critId: number, maxPoints: number) => {
    const newScale = scale.map((category) => {
      if (category.id === catId) {
        let oldMaxPoints = category.criteria.find((crit) => crit.id === critId).maxPoints;
        return {
          ...category,
          maxPoints: category.maxPoints - oldMaxPoints + maxPoints,
          criteria: category.criteria.map((criterion) => {
            if (criterion.id === critId) return { ...criterion, maxPoints };
            else return criterion;
          }),
        };
      } else return category;
    });
    setScale(newScale);
  };

  const handleRenameCriterion = (catId: number, critId: number, newLabel: string) => {
    const newScale = scale.map((category) => {
      if (category.id === catId) {
        return {
          ...category,
          criteria: category.criteria.map((criterion) => {
            if (criterion.id === critId) return { ...criterion, label: newLabel };
            else return criterion;
          }),
        };
      } else return category;
    });
    setScale(newScale);
  };

  const handleRemoveCriterion = (catId: number, critId: number) => {
    let effectivelyRemoved = true;
    const newScale = scale.map((category) => {
      if (category.id === catId) {
        if (category.criteria.length === 1) {
          // Rename the category to match the criterion's label
          effectivelyRemoved = false;
          let critLabel = category.criteria.find((crit) => crit.id === critId).label;
          return { ...category, label: critLabel };
        }

        let oldMaxPoints = category.criteria.find((crit) => crit.id === critId).maxPoints;
        return {
          ...category,
          maxPoints: category.maxPoints - oldMaxPoints,
          criteria: category.criteria.filter((crit) => crit.id !== critId),
        };
      } else return category;
    });
    setScale(newScale);
    if (effectivelyRemoved) setNbCriteria((oldNb) => oldNb - 1);
  };

  const handleAddCategory = (catId: number) => {
    const catIndex = scale.findIndex((cat) => cat.id === catId);
    const fromCategory = scale[catIndex];
    const newCategory = {
      ...fromCategory,
      id: counter++,
      label: incrementLabel(fromCategory.label),
      maxPoints: 1,
      criteria: [{ ...fromCategory.criteria[0], id: counter++, maxPoints: 1 }],
    };
    const newScale = [...scale.slice(0, catIndex + 1), newCategory, ...scale.slice(catIndex + 1)];
    setScale(newScale);
    setNbCategories((oldNb) => oldNb + 1);
    setNbCriteria((oldNb) => oldNb + 1);
  };

  const handleRenameCategory = (catId: number, newLabel: string) => {
    const newScale = scale.map((category) => {
      if (category.id === catId) {
        return { ...category, label: newLabel };
      } else return category;
    });
    setScale(newScale);
  };

  const handleRemoveCategory = (catId: number) => {
    if (scale.length === 1) return;
    setNbCriteria((oldNb) => oldNb - scale.find((cat) => cat.id === catId).criteria.length);
    setScale(scale.filter((cat) => cat.id !== catId));
    setNbCategories((oldNb) => oldNb - 1);
  };

  const categoryTemplate = scale.map(
    (category) =>
      category && (
        <div key={category.id} className={cx("category")}>
          <div className={cx("categoryLabel")}>
            <InputField
              type="text"
              placeholder="Catégorie"
              prependIcon="category"
              value={category.label}
              className={cx("categoryInput")}
              setValue={(newLabel) => handleRenameCategory(category.id, newLabel)}
              isRequired
            />
            <Button
              type="icon"
              iconName="create_new_folder"
              className="teal white--text"
              onClick={() => handleAddCategory(category.id)}
            />
            <Button
              type="icon"
              iconName="folder_delete"
              className={cn("orange", cx("removeCategoryBtn"))}
              onClick={() => handleRemoveCategory(category.id)}
              size="small"
            />
          </div>
          <div className={cx("criteria")}>
            {category.criteria.map(
              (criterion) =>
                criterion && (
                  <div key={criterion.id} className={cx("criterion")}>
                    <div className={cx("criterionLabel")}>
                      <InputField
                        type="text"
                        placeholder="Critère"
                        prependIcon="title"
                        value={criterion.label}
                        className={cx("criterionInput")}
                        setValue={(newLabel) =>
                          handleRenameCriterion(category.id, criterion.id, newLabel)
                        }
                        isRequired
                      />
                      <Button
                        type="icon"
                        iconName="add_task"
                        className="cyan white--text"
                        onClick={() => handleAddCriterion(category.id, criterion.id)}
                      />
                      <Button
                        type="icon"
                        iconName="backspace"
                        className={cn("amber", cx("removeCriterionBtn"))}
                        onClick={() => handleRemoveCriterion(category.id, criterion.id)}
                        size="small"
                      />
                    </div>
                    <div className={cx("radioButtonsContainer")}>
                      {[...Array(21).keys()]
                        .map((i) => i * Number(markPrecision))
                        .map((i) => (
                          <div key={`crit-${criterion.id}-${i}`} className={cx("radioButton")}>
                            <label>
                              <input
                                type="radio"
                                name={`crit-${criterion.id}`}
                                value={i}
                                checked={i === criterion.maxPoints}
                                onChange={() => handleSetMaxPoints(category.id, criterion.id, i)}
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
          </div>
          <p className={cx("categorySummary")}>
            Total de points pour {category.label} : {category.maxPoints}
          </p>
        </div>
      )
  );

  return (
    <div className={cx("evalScale")}>
      {categoryTemplate}
      <hr />
      <div className={cx("scaleSummary")}>
        <p>
          Total des points : {totalPoints}
          <br />
          Nombre de catégories : {nbCategories} | Nombre de critères d&rsquo;évaluation :{" "}
          {nbCriteria}
        </p>
      </div>
    </div>
  );
}
