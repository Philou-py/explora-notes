import {
  useState,
  MouseEvent,
  FormEvent,
  useEffect,
  useRef,
  useId,
  ReactNode,
  CSSProperties,
  useCallback,
  memo,
} from "react";
import inputFieldStyles from "./InputField.module.scss";
import cn from "classnames";
import Ripple from "../Ripple";
import Icon from "../Icon";
import useValidation from "./useValidation";

interface InputFieldProps {
  value: string;
  label?: string;
  placeholder?: string;
  isDisabled?: boolean;
  prependIcon?: string;
  width?: string;
  fullWidth?: boolean;
  setFieldsValidity?: (newValue: object | ((oldValue: object) => object)) => void;
  maxLength?: number;
  minLength?: number;
  isRequired?: boolean;
  customValidationRules?: ((value: string) => true | string)[];
  className?: string;

  // Events handlers from parent
  onPrependIconClick?: (event: MouseEvent<HTMLSpanElement>) => void;
}

interface TextInputProps extends InputFieldProps {
  type: "text" | "email" | "password" | "date";
  setValue: (newValue: string) => void;
}

interface TextAreaProps extends InputFieldProps {
  type: "textarea";
  setValue: (newValue: string) => void;
  nbRows?: number;
  nbCols?: number;
}

interface SelectInputProps extends InputFieldProps {
  type: "select";
  setValue: (newValue: string) => void;
  selectItems: string[][];
  onSelect?: (event: MouseEvent<HTMLLIElement>, item: string) => void;
}

interface FileInputProps extends InputFieldProps {
  type: "file";
  setValue: (newValue: File | "") => void;
  acceptTypes?: string;
}

interface CustomCSSProperties extends CSSProperties {
  "--offset-width": string;
}

function InputField(props: TextInputProps | TextAreaProps | SelectInputProps | FileInputProps) {
  const {
    value,
    label,
    placeholder,
    isDisabled,
    prependIcon,
    width,
    fullWidth = true,
    setFieldsValidity,
    maxLength,
    minLength,
    isRequired = false,
    customValidationRules = [],
    className,

    // Event handlers from parent
    onPrependIconClick,
  } = props;

  const id = useId();
  const { isValid, message } = useValidation(
    value,
    props.type,
    { isRequired, maxLength, minLength },
    customValidationRules
  );
  const [isActive, setIsActive] = useState<boolean>(props.type === "date");
  const [isFocused, setIsFocused] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [computedPlaceholder, setComputedPlaceholder] = useState<string | undefined>(
    placeholder && !label ? placeholder : undefined
  );
  const [selectActive, setSelectActive] = useState(false);
  const [persistentLabel] = useState(props.type === "date");
  const inputFieldRef = useRef<HTMLDivElement>(null);

  // Watchers
  // Set input to always be active when the label is persistent
  useEffect(() => {
    if (persistentLabel) {
      setIsActive(true);
    }
  }, [persistentLabel]);

  useEffect(() => {
    if (props.type == "select") {
      // Event listener to detect if the input field was clicked in order to
      // open the drop-down menu, or if the rest of the body to close it
      let handleClickBody = (event: globalThis.MouseEvent) => {
        let inputField = inputFieldRef.current!;
        let clickedElem = event.target as HTMLElement;
        if (inputField && inputField.contains(clickedElem) && !selectActive && !isDisabled) {
          setSelectActive(true);
          setIsActive(true);
          setIsFocused(true);
        } else {
          setSelectActive(false);
          setIsFocused(false);
        }
      };
      document.addEventListener("click", handleClickBody);

      // props.setValue.call(undefined, props.selectItems[0][1]);

      // Remove event listener on unmount
      return () => {
        document.removeEventListener("click", handleClickBody);
      };
    }
    // eslint-disable-next-line
  }, [props.type, props.isDisabled]);

  // Lift or reset label according to the content of the input field
  useEffect(() => {
    if (value) {
      setIsActive(true);
    } else if (!isFocused && !persistentLabel) {
      setIsActive(false);
    }
  }, [value, isFocused, persistentLabel]);

  // Set or remove the computed placeholder accordingly
  useEffect(() => {
    if (placeholder) {
      if (label) {
        if (isActive) {
          setComputedPlaceholder(placeholder);
        } else {
          setComputedPlaceholder(undefined);
        }
      } else {
        setComputedPlaceholder(placeholder);
      }
    } else {
      setComputedPlaceholder(undefined);
    }
  }, [isActive, placeholder, label]);

  useEffect(() => {
    if (!isTouched && value !== "") {
      setIsTouched(true);
    }
  }, [value, isTouched, setIsTouched]);

  useEffect(() => {
    if (setFieldsValidity) {
      setFieldsValidity((prev) => ({ ...prev, [id]: isValid }));
    }
  }, [isValid, setFieldsValidity, id]);

  // Event handlers
  const handleFocus = useCallback(() => {
    setIsActive(true);
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    if (value && !persistentLabel) {
      setIsActive(false);
      setIsFocused(false);
    } else {
      setIsFocused(false);
    }
  }, [value, persistentLabel]);

  const handleInput = useCallback(
    (event: FormEvent) => {
      if (props.type !== "file") {
        props.setValue.call(undefined, (event.target as HTMLInputElement).value);
      } else {
        if ((event.target as HTMLInputElement).files!.length > 0) {
          props.setValue.call(undefined, (event.target as HTMLInputElement).files![0]);
        } else {
          props.setValue.call(undefined, "");
        }
      }
    },
    [props.type, props.setValue]
  );

  // Templates
  const prependTemplate = prependIcon ? (
    <div className={inputFieldStyles.prepend}>
      <Icon
        iconName={prependIcon}
        className={inputFieldStyles.prependIcon}
        onClick={onPrependIconClick}
      />
    </div>
  ) : (
    false
  );

  let inputTemplate: ReactNode;
  if (props.type !== "textarea" && props.type !== "select") {
    inputTemplate = (
      <input
        type={props.type === "file" ? "text" : props.type}
        disabled={props.type == "file" || isDisabled}
        id={id}
        placeholder={computedPlaceholder}
        required={isRequired}
        value={value}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onInput={handleInput}
      />
    );
  } else if (props.type === "select") {
    let valueIndex: number;
    if (value !== "") {
      valueIndex = 0;
      while (value !== props.selectItems[valueIndex][1]) {
        valueIndex++;
      }
    }

    inputTemplate = (
      <>
        <div className={inputFieldStyles.selectionContainer}>
          {isActive && valueIndex !== undefined && props.selectItems[valueIndex][0]}
        </div>
        <Icon iconName="arrow_drop_down" className={inputFieldStyles["arrow-container"]} />
        {selectActive && (
          <ul className={inputFieldStyles["drop-down"]}>
            {props.selectItems!.map(([itemText, itemValue]) => (
              <Ripple key={itemValue}>
                <li
                  onClick={(event) => {
                    props.setValue(itemValue);
                    if (props.onSelect) {
                      props.onSelect(event, itemValue);
                    }
                    setSelectActive(false);
                  }}
                >
                  {itemText}
                </li>
              </Ripple>
            ))}
          </ul>
        )}
      </>
    );
  } else if (props.type === "textarea") {
    inputTemplate = (
      <textarea
        disabled={isDisabled}
        id={id}
        placeholder={computedPlaceholder}
        required={isRequired}
        value={value}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onInput={handleInput}
        rows={props.nbRows}
        cols={props.nbCols}
      ></textarea>
    );
  }

  let fileInputTemplate: ReactNode;
  if (props.type === "file") {
    fileInputTemplate = (
      <input type="file" accept={props.acceptTypes} onChange={handleInput} disabled={isDisabled} />
    );
  }

  // console.log(`Input Field with label ${label} rendered!`);

  return (
    <div
      className={cn(inputFieldStyles.inputField, className, {
        [inputFieldStyles.disabled]: isDisabled,
        [inputFieldStyles.focused]: isFocused,
        [inputFieldStyles.active]: isActive,
        [inputFieldStyles.empty]: value === "",
        [inputFieldStyles.emptyAndRequired]: isTouched && value === "" && isRequired,
        [inputFieldStyles.valid]: isTouched && isValid,
        // Show invalidity only if the field is not empty and required
        [inputFieldStyles.invalid]: isTouched && !isValid && !(value === "" && isRequired),
        [inputFieldStyles.select]: props.type === "select",
      })}
      ref={inputFieldRef}
      style={
        {
          maxWidth: width ? width : fullWidth ? undefined : "300px",
          "--offset-width": prependIcon ? "30px" : "0px",
        } as CustomCSSProperties
      }
    >
      {prependTemplate}
      {label && (
        <label htmlFor={id} className={cn({ [inputFieldStyles["shift-label"]]: prependIcon })}>
          {label + (isRequired ? " *" : "")}
        </label>
      )}
      <div className={inputFieldStyles.content}>
        {inputTemplate}
        {fileInputTemplate}
        <div className={inputFieldStyles.line}></div>
        <div className={inputFieldStyles.hints}>
          <div className={inputFieldStyles.message}>{isTouched && message}</div>
          {maxLength && (
            <div className={inputFieldStyles.counter}>
              {value.length} / {maxLength}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(InputField);
