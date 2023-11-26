import React, { useEffect, useState } from "react";
import GridGenerator from "./logoGenerator";

const TVSMatrix = [
  [
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0,
  ],
  [
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0,
    0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  ],
  [
    0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0,
    0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1,
  ],
  [
    0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0,
    1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
  ],
  [
    0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1,
    1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0,
  ],
  [
    0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1,
    1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1,
  ],
  [
    0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
    1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  ],
  [
    0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0,
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
      <div className="max-w-md  space-y-4">
        <GridGenerator grid={TVSMatrix} />
        <div className="flex flex-col items-center justify-center text-center font-sans text-xl">
          <p className="p-4  text-2xl font-bold">Software Engineer</p>
          <div className="w-48 border-2 border-x-[3px] border-green-500 p-0.5">
            <div className="border-2 border-x-[3px] border-green-500 p-4 text-center text-base">
              <p>Portfolio Website</p>
              <p>Version 1.00</p>
            </div>
          </div>
          <p className="p-4  text-xl">
            (C) Copyright TVS Corp 1987
            <br />
            (C) Copyright Appy Ltd 2016
          </p>
          <p className="text-xs md:text-xl">
            Implemented by Tony van Swet
            <br />
            Produced by Appy
          </p>
          <a
            href="https://www.linkedin.com/in/tony-van-swet-39374b72/"
            className="underline"
          >
            Find me on LinkedIn
          </a>

          <a href="https://github.com/tonypls" className="underline ">
            Find me on Github
          </a>
          <p className="mt-4 text-base">
            Which Cave Image (press ENTER to restart)?{" "}
            <span className="h-1 animate-ping bg-green-500 ">_</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DOSLandingPage;
