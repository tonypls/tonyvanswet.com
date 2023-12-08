import Head from "next/head";
import Script from "next/script";
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
        <meta property="og:image" content="/sharing-image.png" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="627" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <Script
          defer
          data-domain="tonyvanswet.com"
          src="https://plausible.io/js/script.js"
        />
        <DOSLandingPage />
      </main>
    </>
  );
}
