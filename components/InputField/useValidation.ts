import { useState, useEffect } from "react";

interface BasicValidation {
  isRequired: boolean;
  maxLength?: number;
  minLength?: number;
}

type ValidationRules = ((inputValue: string) => true | string)[];

export default function useValidation(
  inputValue: string,
  inputType: "text" | "email" | "password" | "date" | "textarea" | "select" | "file" | "url",
  { isRequired, maxLength, minLength }: BasicValidation,
  customValidationRules: ValidationRules
) {
  const [isValid, setIsValid] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  function validateInput() {
    // Basic validation
    if (isRequired && !inputValue) {
      setMessage("Ce champ est requis");
    } else if (!maxLength && inputValue.length > 200) {
      setMessage("Longueur max: 200");
    } else if (maxLength && inputValue.length > maxLength) {
      setMessage(`Longueur max: ${maxLength}`);
    } else if (minLength && inputValue.length < minLength) {
      setMessage(`Longueur min: ${minLength}`);
    } else {
      // Default validation (email)
      let defaultValidationPassed = true;
      const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;
      if (inputType === "email" && !emailRegex.test(inputValue)) {
        setMessage("Invalid email");
        defaultValidationPassed = false;
      }

      const URLRegex = /^(http|https):\/\/[^ "]+$/;
      if (inputType === "url" && !URLRegex.test(inputValue)) {
        setMessage("Invalid URL");
        defaultValidationPassed = false;
      }

      if (defaultValidationPassed) {
        // Basic validation was passed - now, check custom validation rules
        let customValidationPassed = true;
        customValidationRules.every((rule) => {
          const result = rule(inputValue);
          if (result !== true) {
            // Rule failed, so stop iteration
            setMessage(result);
            customValidationPassed = false;
            return false;
          } else return true;
        });

        if (customValidationPassed) {
          // All validations passed - the input field is valid
          setIsValid(true);
          setMessage("");
          return;
        }
      }
    }
    setIsValid(false);
  }

  // Re-validate input each time one of the variables below change
  useEffect(validateInput, [
    inputValue,
    inputType,
    isRequired,
    maxLength,
    minLength,
    customValidationRules,
  ]);

  return { isValid, message, validateInput };
}
