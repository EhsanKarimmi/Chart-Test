import React from "react";
import { useFetch } from "./hooks/useFetch";
import { Chart } from "./components/Chart";
import type { RawChart } from "./utils/typeGuards";

const App: React.FC = () => {
  const { data, error, loading } = useFetch<RawChart[]>(
    "https://gist.githubusercontent.com/neysidev/15a03751c9732a5a13b4ff1e1a3afe8d/raw/50b9524ba3a3bfdfcee166cd0afafd8f48ed2049/data.json"
  );

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        Loading Charts...
      </div>
    );
  if (error)
    return <div className="p-8 text-red-600">Error: {error.message}</div>;
  if (!data) return <div className="p-8">No Data Found :(</div>;

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <h1 className="text-2xl uppercase font-semibold mb-6 text-center">
        Charts Overview
      </h1>
      {data.map((chart, idx) => (
        <Chart key={idx} chart={chart} />
      ))}
    </div>
  );
};

export default App;
