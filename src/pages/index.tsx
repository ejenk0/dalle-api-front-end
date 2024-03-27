import { faChevronRight, faX } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Disclosure, Transition } from "@headlessui/react";
import classNames from "classnames";
import Head from "next/head";
import Image from "next/image";
import OpenAI from "openai";
import { type OpenAIError } from "openai/error.mjs";
import { useCallback, useEffect, useRef, useState } from "react";

type GeneratedImage = {
  id: string; // UUID
  imageUrl: string;
  originalPrompt: string;
  revisedPrompt: string;
};

const defaultImages = [
  {
    id: crypto.randomUUID(),
    imageUrl:
      "https://oaidalleapiprodscus.blob.core.windows.net/private/org-zWJEyLu9IbaYjWOr0IlZSf2O/user-W9BErYk8conN6sInGJ7Ncvai/img-eqNw0e4lNKTqrkGs9jMUqSjR.png?st=2024-03-27T12%3A05%3A51Z&se=2024-03-27T14%3A05%3A51Z&sp=r&sv=2021-08-06&sr=b&rscd=inline&rsct=image/png&skoid=6aaadede-4fb3-4698-a8f6-684d7786b067&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2024-03-26T21%3A02%3A26Z&ske=2024-03-27T21%3A02%3A26Z&sks=b&skv=2021-08-06&sig=%2BAcFrV8LTrPSos5bSsJp6Tcfh8q4IlDBf%2BsIAlFcH6A%3D",
    originalPrompt:
      "A detailed close-up image of a classic Vincent Rapide motorcycle in a majestic British country side. It is imperative that the details of the Vincent Rapide are accurate to the real life classic bike.",
    revisedPrompt:
      "Create a close-up detailed image of a classic Vincent Rapide motorcycle, positioned in the grandeur of the British countryside. The motorcycle maintains its historical aesthetics with chrome accents, spoked wheels, a large round headlamp, and the iconic gas tank. The surrounding environment is filled with typical British countryside elements like rolling green hills, scattered sheep, and a backdrop of distant, misty mountains. The scene is during daylight with soft rays of sun, adding a touch of glow to the landscape and the motorcycle.",
  },
  {
    id: crypto.randomUUID(),
    imageUrl:
      "https://oaidalleapiprodscus.blob.core.windows.net/private/org-zWJEyLu9IbaYjWOr0IlZSf2O/user-W9BErYk8conN6sInGJ7Ncvai/img-Oe7SYvap60vo2gXyXr2D6Gqm.png?st=2024-03-27T12%3A28%3A23Z&se=2024-03-27T14%3A28%3A23Z&sp=r&sv=2021-08-06&sr=b&rscd=inline&rsct=image/png&skoid=6aaadede-4fb3-4698-a8f6-684d7786b067&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2024-03-26T21%3A03%3A36Z&ske=2024-03-27T21%3A03%3A36Z&sks=b&skv=2021-08-06&sig=ZaWN0wKKF9hzmpEubo/xscCWYuHvUzb1bvqsB9qXAtY%3D",
    originalPrompt:
      "A joyful looking Canadian bear generating fun images using an AI",
    revisedPrompt:
      "An exuberant, Canadian bear with a joyous expression on its face. It's sitting in front of a large computer screen, engrossed in the task of creating delightful and fun images with the use of artificial intelligence technology. The bear's fur is thick and lush, indicative of its excellent health and vivaciousness. The backdrop showcases a serene Canadian forest with verdant evergreens peppering the landscape. The sunlight peeping in through the trees adds a beautiful, warm glow to the scene. The computer the bear is using is modern and sleek, further emphasizing its dedication to its exciting project.",
  },
  {
    id: crypto.randomUUID(),
    imageUrl:
      "https://oaidalleapiprodscus.blob.core.windows.net/private/org-zWJEyLu9IbaYjWOr0IlZSf2O/user-W9BErYk8conN6sInGJ7Ncvai/img-ZwOn0HBoWB2uY2hca3aQZ5Op.png?st=2024-03-27T12%3A30%3A45Z&se=2024-03-27T14%3A30%3A45Z&sp=r&sv=2021-08-06&sr=b&rscd=inline&rsct=image/png&skoid=6aaadede-4fb3-4698-a8f6-684d7786b067&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2024-03-27T13%3A21%3A35Z&ske=2024-03-28T13%3A21%3A35Z&sks=b&skv=2021-08-06&sig=Ye6xGlEXb10O0ooQbWX%2BZJAvO9tRjJT43aem6Wl57dY%3D",
    originalPrompt:
      "A jaw-droppingly stunning birds-eye-view of a fantasy valley filled with trees, rivers, lakes, a village, mystical creatures and a dragon flying overhead in the distance. Stormy cloudy weather to the right and clear skies to the left.",
    revisedPrompt:
      "Imagine an extraordinary top-down view of a fantastical valley. This valley is bursting with life, embodied in its dense forest, meandering rivers, and sparkling lakes. A quaint village can be seen nestled amidst this nature, inhabited by mythical beings. In the skies, yet maintaining a safe distance, a dragon can be seen soaring with grace. The weather is an intriguing mix, with tumultuous clouds gathering to the right hinting at a storm, while the left reveals pristine clear blue skies. This juxtaposition of climates further adds to the mystery and allure of this scene.",
  },
] as GeneratedImage[];

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
      console.log("blah");
      setFailureMessage(
        "Welcome! This is your first visit, so I've added some example images for you to get started. All your generated images will be stored here in your browser for you to come back to later. Enjoy! :)",
      );
      setImages(defaultImages);
      return;
    }

    try {
      const storedImages = JSON.parse(storedImagesRaw ?? "[]") as
        | GeneratedImage[]
        | string[];
      if (storedImages.length === 0) {
        return;
      }
      if (storedImages.every((url) => typeof url === "string")) {
        setFailureMessage(
          "Your stored images were in an old format. They have been converted to the new format, but some information may be missing. I've also added on some example images. Welcome back! :)",
        );
        console.warn(
          "Old image format detected. Filling empty properties with defaults.",
        );
        const newImages = storedImages.map((url) => ({
          id: crypto.randomUUID(),
          imageUrl: url as string, // Cast imageUrl to string
          originalPrompt:
            "Image generated with old format, no prompt available.",
          revisedPrompt:
            "Image generated with old format, no revised prompt available.",
        }));
        setImages([...newImages, ...defaultImages]);
        return;
      }
      if (storedImages.every((img) => typeof img === "object")) {
        setImages(storedImages as GeneratedImage[]);
        return;
      }
      // If we reach here, the stored images are malformed
      setFailureMessage(
        "Your stored images were malformed. They have been replaced with the default images. Your old data has been saved to a recovery entry in your browser's local storage. Contact the developer for help recovering your data.",
      );
      console.warn(
        "Stored images were malformed. Replacing with default images. Old data saved to recovery entry.",
      );
      setImages(defaultImages);
      localStorage.setItem(
        "generated-images-recovery-" + Date.now(),
        storedImagesRaw,
      );
    } catch (e) {
      if (e instanceof SyntaxError) {
        setFailureMessage(
          "Your stored images were malformed. They have been replaced with the default images. Your old data has been saved to a recovery entry in your browser's local storage. Contact the developer for help recovering your data.",
        );
        console.warn(
          "Stored images were malformed. Replacing with default images. Old data saved to recovery entry.",
        );
        setImages(defaultImages);
        localStorage.setItem(
          "generated-images-recovery-" + Date.now(),
          storedImagesRaw,
        );
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
          className="fixed left-1 top-1 text-white opacity-60"
          href="https://semver.org/spec/v2.0.0.html"
        >
          v0.1.0
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
          <a href={mainImage?.imageUrl ?? "#"} target="_blank" rel="noreferrer">
            <Image
              alt={"Generated DALL-E image"}
              src={mainImage?.imageUrl ?? "/placeholder.png"}
              width={700}
              height={700}
              ref={mainImageRef}
              className={classNames({ "blur-md": !mainImage })}
              onLoad={handleImageLoaded}
              priority={true}
            />
          </a>
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
                src={image.imageUrl}
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
    })
    .then((res) => {
      if (res.data.length > 0 && res.data[0]?.url) {
        console.log("Image generated", res.data[0].url);
        onSuccess({
          id: crypto.randomUUID(),
          imageUrl: res.data[0].url,
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
