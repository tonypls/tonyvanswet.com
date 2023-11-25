// GreenBlock.tsx
interface GreenBlockProps {
  isOn: boolean;
}

const GreenBlock: React.FC<GreenBlockProps> = ({ isOn }) => (
  <div
    className={`h-3 w-full ${isOn ? "bg-green-500" : "bg-transparent"}`}
  ></div>
);

// GridGenerator.tsx
interface GridGeneratorProps {
  grid: number[][];
}

const GridGenerator: React.FC<GridGeneratorProps> = ({ grid }) => {
  return (
    <div className="space-y-2">
      {grid.map((row, rowIndex) => (
        <div key={rowIndex} className="flex flex-row gap-x-0">
          {row.map((cell, cellIndex) => (
            <GreenBlock key={cellIndex} isOn={cell === 1} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default GridGenerator;
