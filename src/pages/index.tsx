import Head from "next/head";
import DOSLandingPage from "./landingPage";

export default function Home() {
  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Tony van Swet - Software & Climate" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <DOSLandingPage />
      </main>
    </>
  );
}
