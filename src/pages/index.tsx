import { faX } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import Head from "next/head";
import Image from "next/image";
import OpenAI from "openai";
import { type OpenAIError } from "openai/error.mjs";
import { useCallback, useEffect, useRef, useState } from "react";

export default function Home() {
  const apiKeyRef = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const mainImageRef = useRef<HTMLImageElement>(null);
  const [loading, setLoading] = useState(false);
  const [images, _setImages] = useState<string[]>([]);
  const [mainImage, _setMainImage] = useState<string | null>(null);
  const [failureMessage, setFailureMessage] = useState<string | null>(null);

  const setMainImage = (newImage: string | null) => {
    _setMainImage(newImage);
    // if (newImage) scrollToMainImage();
  };

  const addImage = (newImage: string) => {
    setMainImage(newImage);
    const newImages = [...images, newImage];
    setImages(newImages);
  };

  const removeImage = (image: string) => {
    const newImages = images.filter((i) => i !== image);
    setImages(newImages);
    if (mainImage === image) setMainImage(null);
  };

  const setImages = (newImages: string[]) => {
    _setImages(newImages);
    localStorage.setItem("generated-images", JSON.stringify(newImages));
  };

  const handleImageLoaded = () => {
    if (mainImage) scrollToMainImage();
  };

  useEffect(() => {
    const storedImagesRaw = localStorage.getItem("generated-images");

    // First visit, set empty array
    if (!storedImagesRaw) {
      setImages([]);
      return;
    }

    try {
      const storedImages = JSON.parse(storedImagesRaw ?? "[]") as string[];
      setImages(storedImages);
    } catch (e) {
      if (e instanceof SyntaxError) {
        console.warn(
          "'generated-images' was malformed JSON. Replacing with empty array.",
        );
        setImages([]);
        return;
      }
    }
  }, []);

  useEffect(() => {
    if (!apiKeyRef.current) return;

    const apiKey = localStorage.getItem("openai-api-key");
    if (apiKey) {
      apiKeyRef.current.value = apiKey;
    }
  }, [apiKeyRef]);

  const onApiKeyChange = (value: string) => {
    localStorage.setItem("openai-api-key", value);
    updateCanSubmit();
  };

  const handleSubmit = () => {
    if (loading) return;
    const apiKey = apiKeyRef.current?.value;
    const prompt = promptRef.current?.value;

    if (!apiKey || !prompt) {
      return;
    }

    generateImage(apiKey, prompt, addImage, setLoading, setFailureMessage);
  };

  const [canSubmit, setCanSubmit] = useState(false);
  const updateCanSubmit = useCallback(() => {
    const can =
      !loading &&
      apiKeyRef.current !== null &&
      promptRef.current !== null &&
      apiKeyRef.current.value.length > 0 &&
      promptRef.current.value.length > 0;

    if (can !== canSubmit) setCanSubmit(can);
  }, [loading, canSubmit]);

  useEffect(() => {
    updateCanSubmit();
  }, [loading, updateCanSubmit]);

  const scrollToMainImage = () => {
    if (mainImageRef.current)
      mainImageRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
        // inline: "center",
      });
  };

  // useEffect(() => {
  //   if (!loading) scrollToMainImage();
  // }, [loading]);

  return (
    <>
      <Head>
        <title>DALL-E</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] pb-10">
        <a
          className="absolute right-0 top-0 ml-auto p-2"
          href="https://github.com/ejenk0/gpt-api-fe"
        >
          <Image
            src="/github-mark-white.svg"
            alt="Github"
            width={30}
            height={30}
          />
        </a>
        <div className="container flex flex-col items-center justify-center gap-6 px-4 py-16">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            <span className="text-[hsl(280,100%,70%)]">DALL-E</span> API
          </h1>
          <div className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-[3rem]">
            Front-end by Evyn Jenkins
          </div>
          <form
            className="flex flex-col items-center gap-4 overflow-x-visible text-black"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            {failureMessage !== null && (
              <div className="text-wrap text-red-500">{failureMessage}</div>
            )}
            <div className="rounded-md bg-gradient-to-b from-white to-slate-100 p-3">
              <label>API Key</label>
              <input
                type="text"
                className="w-full rounded-md border bg-white p-2 text-black"
                placeholder="API Key..."
                ref={apiKeyRef}
                onChange={(e) => onApiKeyChange(e.target.value)}
              />
            </div>
            <div className="rounded-md bg-gradient-to-b from-white to-slate-100 p-3">
              <label>Prompt</label>
              <textarea
                cols={23}
                rows={5}
                className="max-h-44 min-h-20 w-full rounded-md border bg-white p-2 text-black"
                placeholder="Prompt..."
                ref={promptRef}
                onChange={updateCanSubmit}
              />
            </div>
            <button
              disabled={!canSubmit}
              className="rounded-md bg-gradient-to-b from-white to-slate-100 px-4 py-2 text-black transition-all duration-300 hover:from-cyan-300 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleSubmit}
              type="submit"
            >
              Generate
            </button>
          </form>

          {loading && <div className="italic text-white">Generating...</div>}
          <a href={mainImage ?? "#"} target="_blank" rel="noreferrer">
            <Image
              alt={"Generated DALL-E image"}
              src={mainImage ?? "/placeholder.png"}
              width={700}
              height={700}
              ref={mainImageRef}
              className={classNames({ "blur-md": !mainImage })}
              onLoad={handleImageLoaded}
              priority={true}
            />
          </a>
        </div>
        <div className="mb-4 w-full bg-gradient-to-b from-white to-slate-300 py-1 text-center tracking-wide text-black">
          Recent Images
        </div>
        <div className="mx-2 flex w-fit flex-wrap justify-center gap-3">
          {images.map((image) => (
            <div key={image} className="relative">
              <Image
                className="ring-white transition-all duration-300 hover:cursor-pointer hover:rounded-sm hover:ring-1"
                src={image}
                alt={"A preview of a previously generated image."}
                width={100}
                height={100}
                onClick={() => setMainImage(image)}
              />
              <button
                className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-white p-1 text-xs text-black hover:bg-gray-200"
                type="button"
                onClick={() => removeImage(image)}
              >
                <FontAwesomeIcon
                  icon={faX}
                  size="xs"
                  className="absolute left-1 top-[3px]"
                />
              </button>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

function generateImage(
  apiKey: string,
  prompt: string,
  onSuccess: (imageUrl: string) => void,
  setLoading: (isLoading: boolean) => void,
  onFail: (message: string) => void,
) {
  setLoading(true);

  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  openai.images
    .generate({
      prompt,
      model: "dall-e-3",
    })
    .then((res) => {
      if (res.data.length > 0 && res.data[0]?.url) {
        console.log("Image generated", res.data[0].url);
        onSuccess(res.data[0].url);
      } else {
        console.warn("No image found in response", res);
        onFail("No image found in response. This is probably not your fault.");
      }
      setLoading(false);
    })
    .catch((err: OpenAIError) => {
      console.warn(err.message);
      setLoading(false);
      onFail(err.message);
    });
}
