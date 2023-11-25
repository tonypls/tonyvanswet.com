import React, { useEffect, useState } from "react";
import GridGenerator from "./logoGenerator";

const TVSMatrix = [
  [
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0,
  ],
  [
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  ],
  [
    0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0,
    0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1,
  ],
  [
    0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0,
    0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
  ],
  [
    0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0,
    1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0,
  ],
  [
    0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
    1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1,
  ],
  [
    0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1,
    1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  ],
  [
    0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1,
    1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0,
  ],
];

const DOSLandingPage = () => {
  const [animate, setAnimate] = useState<boolean>(false);

  const handleKeyPress = (event: KeyboardEvent): void => {
    if (event.key === "Enter") {
      setAnimate(true);

      setTimeout(() => {
        setAnimate(false);
      }, 1000);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  return (
    <div
      className={`flex min-h-screen w-full flex-col  bg-black p-4 font-mono text-xs text-green-500 md:text-sm ${
        animate ? "animate-spin" : ""
      }`}
    >
      <div className="w-[600px] space-y-4">
        <GridGenerator grid={TVSMatrix} />
        <p className="mb-2">Software Engineer</p>
        <div className="border border-green-500 p-1">
          <div className="border border-green-500 p-4 text-center">
            <p>Portfolio Website</p>
            <p>Version 1.00</p>
          </div>
        </div>
        <p className="text-xs  md:text-base">
          (C) Copyright TVS Corp 1987
          <br />
          (C) Copyright Appy Ltd. 2016
        </p>
        <p className="text-xs md:text-base">
          Implemented by Tony van Swet
          <br />
          Produced by Appy
        </p>
        <a
          href="https://www.linkedin.com/in/tony-van-swet-39374b72/"
          className="text-xs underline md:text-base"
        >
          Find me on LinkedIn
        </a>
        <p className="mt-4">
          Which Cave Image (press ENTER to restart)?{" "}
          <span className=" h-1 animate-ping bg-green-500 ">_</span>
        </p>
      </div>
    </div>
  );
};

export default DOSLandingPage;
