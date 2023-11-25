import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Tony van Swet - Software & Climate" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <h1 className="font-sans text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            Tony van Swet
          </h1>
        </div>
      </main>
    </>
  );
}
