import { CSSProperties, memo, useContext } from "react";
import { BreakpointsContext } from "../contexts/BreakpointsContext";

function Footer() {
  const { currentBreakpoint } = useContext(BreakpointsContext);

  const footerStyles: CSSProperties = {
    padding: "10px 0",
    textAlign: "center",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    flexDirection: currentBreakpoint === "xs" || currentBreakpoint === "sm" ? "column" : "row",
    position: "relative",
  };

  const paragraphStyles: CSSProperties = {
    marginLeft: "5%",
    marginRight: "5%",
    position: "relative",
  };

  const bgSVGStyles: CSSProperties = {
    position: "absolute",
    top: 0,
    height: "100%",
    width: "100%",
  };

  return (
    <footer style={footerStyles}>
      <StackedWavesSVG style={bgSVGStyles} />
      <p style={paragraphStyles}>
        Contactez-nous via <a href="mailto:exploranotes@gmail.com">exploranotes@gmail.com</a> !
      </p>
      <p style={paragraphStyles}>
        Ce site est open-source ! Son code est disponible sur&nbsp;
        <a
          href="https://github.com/Philou-py/explora-notes"
          rel="noopener noreferrer"
          target="_blank"
        >
          GitHub
        </a>
        .
      </p>
    </footer>
  );
}

function StackedWavesSVG({ style }: { style?: CSSProperties }) {
  return (
    <svg
      id="visual"
      viewBox="0 0 960 200"
      width="960"
      height="200"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      version="1.1"
      style={style}
    >
      <path
        d="M0 41L14.5 42.3C29 43.7 58 46.3 87.2 42.7C116.3 39 145.7 29 174.8 28.3C204 27.7 233 36.3 262 40.7C291 45 320 45 349 41.3C378 37.7 407 30.3 436.2 30C465.3 29.7 494.7 36.3 523.8 36.7C553 37 582 31 611 31.7C640 32.3 669 39.7 698 42C727 44.3 756 41.7 785.2 37.7C814.3 33.7 843.7 28.3 872.8 29.7C902 31 931 39 945.5 43L960 47L960 0L945.5 0C931 0 902 0 872.8 0C843.7 0 814.3 0 785.2 0C756 0 727 0 698 0C669 0 640 0 611 0C582 0 553 0 523.8 0C494.7 0 465.3 0 436.2 0C407 0 378 0 349 0C320 0 291 0 262 0C233 0 204 0 174.8 0C145.7 0 116.3 0 87.2 0C58 0 29 0 14.5 0L0 0Z"
        fill="#e4bb70"
      ></path>
      <path
        d="M0 91L14.5 91.3C29 91.7 58 92.3 87.2 88.7C116.3 85 145.7 77 174.8 74.7C204 72.3 233 75.7 262 80C291 84.3 320 89.7 349 88.3C378 87 407 79 436.2 74.7C465.3 70.3 494.7 69.7 523.8 71.3C553 73 582 77 611 80.7C640 84.3 669 87.7 698 89.7C727 91.7 756 92.3 785.2 90C814.3 87.7 843.7 82.3 872.8 83C902 83.7 931 90.3 945.5 93.7L960 97L960 45L945.5 41C931 37 902 29 872.8 27.7C843.7 26.3 814.3 31.7 785.2 35.7C756 39.7 727 42.3 698 40C669 37.7 640 30.3 611 29.7C582 29 553 35 523.8 34.7C494.7 34.3 465.3 27.7 436.2 28C407 28.3 378 35.7 349 39.3C320 43 291 43 262 38.7C233 34.3 204 25.7 174.8 26.3C145.7 27 116.3 37 87.2 40.7C58 44.3 29 41.7 14.5 40.3L0 39Z"
        fill="#ddac51"
      ></path>
      <path
        d="M0 123L14.5 120.3C29 117.7 58 112.3 87.2 105.7C116.3 99 145.7 91 174.8 90.7C204 90.3 233 97.7 262 103.7C291 109.7 320 114.3 349 112C378 109.7 407 100.3 436.2 97.3C465.3 94.3 494.7 97.7 523.8 99.3C553 101 582 101 611 102C640 103 669 105 698 107.7C727 110.3 756 113.7 785.2 113C814.3 112.3 843.7 107.7 872.8 108.3C902 109 931 115 945.5 118L960 121L960 95L945.5 91.7C931 88.3 902 81.7 872.8 81C843.7 80.3 814.3 85.7 785.2 88C756 90.3 727 89.7 698 87.7C669 85.7 640 82.3 611 78.7C582 75 553 71 523.8 69.3C494.7 67.7 465.3 68.3 436.2 72.7C407 77 378 85 349 86.3C320 87.7 291 82.3 262 78C233 73.7 204 70.3 174.8 72.7C145.7 75 116.3 83 87.2 86.7C58 90.3 29 89.7 14.5 89.3L0 89Z"
        fill="#d69c2f"
      ></path>
      <path
        d="M0 165L14.5 168C29 171 58 177 87.2 177.3C116.3 177.7 145.7 172.3 174.8 170C204 167.7 233 168.3 262 167C291 165.7 320 162.3 349 164.3C378 166.3 407 173.7 436.2 174.3C465.3 175 494.7 169 523.8 168C553 167 582 171 611 173.7C640 176.3 669 177.7 698 175.3C727 173 756 167 785.2 165.3C814.3 163.7 843.7 166.3 872.8 166.3C902 166.3 931 163.7 945.5 162.3L960 161L960 119L945.5 116C931 113 902 107 872.8 106.3C843.7 105.7 814.3 110.3 785.2 111C756 111.7 727 108.3 698 105.7C669 103 640 101 611 100C582 99 553 99 523.8 97.3C494.7 95.7 465.3 92.3 436.2 95.3C407 98.3 378 107.7 349 110C320 112.3 291 107.7 262 101.7C233 95.7 204 88.3 174.8 88.7C145.7 89 116.3 97 87.2 103.7C58 110.3 29 115.7 14.5 118.3L0 121Z"
        fill="#b98729"
      ></path>
      <path
        d="M0 201L14.5 201C29 201 58 201 87.2 201C116.3 201 145.7 201 174.8 201C204 201 233 201 262 201C291 201 320 201 349 201C378 201 407 201 436.2 201C465.3 201 494.7 201 523.8 201C553 201 582 201 611 201C640 201 669 201 698 201C727 201 756 201 785.2 201C814.3 201 843.7 201 872.8 201C902 201 931 201 945.5 201L960 201L960 159L945.5 160.3C931 161.7 902 164.3 872.8 164.3C843.7 164.3 814.3 161.7 785.2 163.3C756 165 727 171 698 173.3C669 175.7 640 174.3 611 171.7C582 169 553 165 523.8 166C494.7 167 465.3 173 436.2 172.3C407 171.7 378 164.3 349 162.3C320 160.3 291 163.7 262 165C233 166.3 204 165.7 174.8 168C145.7 170.3 116.3 175.7 87.2 175.3C58 175 29 169 14.5 166L0 163Z"
        fill="#9d7223"
      ></path>
    </svg>
  );
}

export default memo(Footer);
