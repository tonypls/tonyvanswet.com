import React from "react";
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
  return (
    <>
      <div className="flex min-h-screen w-full flex-col bg-black p-4 font-mono text-xs text-green-500 md:text-sm">
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
          </div>
        </div>
      </div>
    </>
  );
};

export default DOSLandingPage;
