import { memo } from "react";

function Spacer() {
  return <div className="spacer" style={{ flexGrow: 1 }}></div>;
}

export default memo(Spacer);
