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
  const [playDoom, setPlayDoom] = useState<boolean>(false);

  const handleStartDoom = () => {
    setPlayDoom(true);
  };
  const handleKeyPress = (event: KeyboardEvent): void => {
    if (event.key === "Enter") {
      handleStartDoom();
      // setAnimate(true);

      // setTimeout(() => {
      //   setAnimate(false);
      // }, 1000);
    }
    if (event.key === "Escape") {
      setPlayDoom(false);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  return (
    <>
      <div
        className={`flex min-h-screen w-full flex-col bg-black  p-4  font-mono text-xs text-green-500 md:text-sm ${
          animate ? "animate-spin" : ""
        }`}
      >
        <div className="max-w-md  space-y-4">
          <GridGenerator grid={TVSMatrix} />
          <div className="flex flex-col items-center justify-center text-center font-sans text-xl">
            <p className="text-shadow-neon-green p-2 text-2xl font-bold">
              Tony van Swet
            </p>
            <p className="text-shadow-neon-green p-4 pt-0 text-2xl font-bold">
              Software Engineer
            </p>
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
              Implemented by{" "}
              <span className="text-shadow-neon-green">Tony van Swet</span>
              <br />
              Produced by Appy
            </p>
            <a
              href="https://www.linkedin.com/in/tony-van-swet"
              className="underline"
            >
              Find me on LinkedIn
            </a>

            <a href="https://github.com/tonypls" className="underline ">
              Find me on Github
            </a>
            <button
              className="mt-4 cursor-pointer text-base"
              onClick={handleStartDoom}
            >
              Want to play doom (press
              <span className="text-shadow-neon-green"> ENTER</span> to start)?{" "}
              <span className="h-1 animate-ping bg-green-500 ">_</span>
            </button>
          </div>
        </div>
      </div>
      {playDoom && (
        <div
          className="h-full w-full"
          onClick={() => {
            setPlayDoom(false);
          }}
        >
          <iframe
            className="absolute left-1/2 top-1/2 h-1/2 w-full -translate-x-1/2 -translate-y-1/2 transform py-8 md:h-full md:p-8 "
            width="680"
            height="400"
            src="https://dos.zone/player/?bundleUrl=https%3A%2F%2Fcdn.dos.zone%2Fcustom%2Fdos%2Fdoom.jsdos?anonymous=1"
            data-origwidth="680"
            data-origheight="400"
          ></iframe>
          <button
            onClick={() => setPlayDoom(false)}
            className="absolute right-2 top-24 flex h-10  w-10 items-center justify-center rounded-full border-4 border-green-500 bg-black pl-0.5  pt-0.5  text-center text-xl text-green-500 hover:bg-gray-700  md:top-4  md:text-2xl"
          >
            <p>X</p>
          </button>
        </div>
      )}
    </>
  );
};

export default DOSLandingPage;
