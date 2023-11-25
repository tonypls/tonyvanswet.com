import Head from "next/head";
import DOSLandingPage from "./landingPage";

export default function Home() {
  return (
    <>
      <Head>
        <title>Tony van Swet - Software + Decarbonisation</title>
        <meta
          name="description"
          content="Tony van Swet - Software and Decarbonisation"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <DOSLandingPage />
      </main>
    </>
  );
}
