export const roundNum = (value: number, nbDecimals: number) => {
  if (value !== undefined) {
    return Math.round((value + Number.EPSILON) * 10 ** nbDecimals) / 10 ** nbDecimals;
  } else {
    return "";
  }
};
