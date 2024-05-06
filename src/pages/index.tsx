import { faChevronRight, faX } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Disclosure, Transition } from "@headlessui/react";
import classNames from "classnames";
import Head from "next/head";
import Image from "next/image";
import OpenAI from "openai";
import { type OpenAIError } from "openai/error.mjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { get as idbGet, set as idbSet } from "idb-keyval";
import defaultImagesRaw from "public/defaultImages.json";

type GeneratedImage = {
  id: string; // UUID
  imageData: string;
  originalPrompt: string;
  revisedPrompt: string;
};

export default function Home() {
  const apiKeyRef = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const mainImageRef = useRef<HTMLImageElement>(null);
  const [loading, setLoading] = useState(false);
  const [images, _setImages] = useState<GeneratedImage[]>([]);
  const [mainImage, _setMainImage] = useState<GeneratedImage | null>(null);
  const [failureMessage, setFailureMessage] = useState<string | null>(null);

  const setMainImage = (newImage: GeneratedImage | null) => {
    _setMainImage(newImage);
    // if (newImage) scrollToMainImage();
  };

  const addImage = (newImage: GeneratedImage) => {
    setMainImage(newImage);
    const newImages = [...images, newImage];
    setImages(newImages);
  };

  const removeImage = (image: GeneratedImage) => {
    const newImages = images.filter((i) => i !== image);
    setImages(newImages);
    if (mainImage === image) setMainImage(null);
  };

  const setImages = (newImages: GeneratedImage[]) => {
    idbSet("generated-images", newImages)
      .then(() => {
        _setImages(newImages);
      })
      .catch((err) => {
        console.error("Failed to set images in IndexedDB", err);
      });
  };

  const handleImageLoaded = () => {
    if (mainImage) scrollToMainImage();
  };

  useEffect(() => {
    void (async () => {
      const storedImages: GeneratedImage[] | undefined =
        await idbGet("generated-images");

      // First visit, set empty array
      if (!storedImages) {
        if (localStorage.getItem("generated-images")) {
          setFailureMessage(
            "Welcome back! Your previously generated images have expired, but you can generate new ones now and they will persist in your browser until you clear your IndexedDB. I have also added some example images for you to get started. Enjoy! :)",
          );
          localStorage.removeItem("generated-images");
        } else {
          setFailureMessage(
            "Welcome! This is your first visit, so I've added some example images for you to get started. All your generated images will be stored here in your browser for you to come back to later. Enjoy! :)",
          );
        }

        setImages(defaultImagesRaw as GeneratedImage[]);

        return;
      }

      setImages(storedImages);
    })();
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
          className="absolute right-0 top-0 p-2"
          href="https://github.com/ejenk0/gpt-api-fe"
        >
          <Image
            src="/github-mark-white.svg"
            alt="Github"
            width={30}
            height={30}
          />
        </a>
        <a
          className="fixed left-2 top-1 text-white underline opacity-60"
          href="https://semver.org/spec/v2.0.0.html"
        >
          v1.0.0
        </a>
        <div className="container flex flex-col items-center justify-center gap-6 px-4 py-16">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            <span className="text-[hsl(280,100%,70%)]">DALL-E</span> API
          </h1>
          <div className="mb-4 text-center text-2xl font-bold tracking-tight text-white sm:text-[3rem]">
            Front-end by Evyn Jenkins
          </div>
          <form
            className="flex flex-col items-center gap-4 overflow-x-visible text-black"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            {failureMessage !== null && (
              <div className="text-wrap text-center text-[hsl(280,100%,82%)]">
                {failureMessage}
              </div>
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
          <Image
            alt={"Generated DALL-E image"}
            src={
              mainImage?.imageData
                ? `data:image/png;base64,${mainImage.imageData}`
                : "/placeholder.png"
            }
            width={700}
            height={700}
            ref={mainImageRef}
            className={classNames({ "blur-md": !mainImage })}
            onLoad={handleImageLoaded}
            priority={true}
          />
          <Disclosure
            as="div"
            className={classNames(
              "w-full rounded-md bg-gradient-to-b from-white to-slate-100 p-3",
              {
                hidden: !mainImage,
              },
            )}
          >
            {({ open }) => (
              <>
                <Disclosure.Button
                  as="div"
                  className="mr-auto flex items-center gap-1 text-slate-700 transition-colors hover:cursor-pointer hover:text-black"
                >
                  <FontAwesomeIcon
                    icon={faChevronRight}
                    className={classNames("h-4 w-4 transition-transform", {
                      "rotate-90": open,
                    })}
                  />
                  See prompt
                </Disclosure.Button>
                <Transition
                  enter="transition duration-100 ease-out"
                  enterFrom="transform scale-95 opacity-0"
                  enterTo="transform scale-100 opacity-100"
                  leave="transition duration-75 ease-out"
                  leaveFrom="transform scale-100 opacity-100"
                  leaveTo="transform scale-95 opacity-0"
                >
                  <Disclosure.Panel>
                    <p className="font-semibold">🙋 Input Prompt:</p>
                    <p className="ml-2">{mainImage?.originalPrompt}</p>
                    <p className="font-semibold">🤖 Revised Prompt:</p>
                    <p className="ml-2">{mainImage?.revisedPrompt}</p>
                  </Disclosure.Panel>
                </Transition>
              </>
            )}
          </Disclosure>
        </div>
        <div
          className={classNames(
            "mb-4 min-w-60 rounded-md bg-gradient-to-b from-white to-slate-300 px-4 py-1 text-center tracking-wide text-black",
            {
              hidden: images.length === 0,
            },
          )}
        >
          Recent Images
        </div>
        <div className="mx-2 flex w-fit flex-wrap justify-center gap-3">
          {images.map((image) => (
            <div key={image.id} className="relative">
              <Image
                className="ring-white transition-all duration-300 hover:cursor-pointer hover:rounded-sm hover:ring-1"
                src={`data:image/png;base64,${image.imageData}`}
                alt={"A preview of a previously generated image."}
                width={100}
                height={100}
                onClick={() => setMainImage(image)}
              />
              <button
                className="absolute -left-2 -top-2 h-3.5 w-3.5 rounded-full bg-white p-1 text-xs text-black hover:bg-gray-200"
                type="button"
                onClick={() => removeImage(image)}
              >
                <FontAwesomeIcon
                  icon={faX}
                  size="xs"
                  className="absolute left-[4px] top-[3px]"
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
  onSuccess: (response: GeneratedImage) => void,
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
      response_format: "b64_json",
    })
    .then((res) => {
      if (res.data.length > 0 && res.data[0]?.b64_json) {
        console.log("Image generated", res.data[0].b64_json);
        onSuccess({
          id: crypto.randomUUID(),
          imageData: res.data[0].b64_json,
          originalPrompt: prompt,
          revisedPrompt: res.data[0].revised_prompt ?? prompt,
        });
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
