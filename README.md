# DALL-E Simple Front End

This is a basic **front-end** to OpenAI's **DALLE-E** image generation model API. It keeps track of your recently generated images so you don't lose your masterpieces. 🐻💻

## How to

- Create an OpenAI account, create an API key and add a payment method and some funds.
  - There is a pretty good guide on how to do this [here](https://www.maisieai.com/help/how-to-get-an-openai-api-key-for-chatgpt) if you are lost.
- Go to [evyn.info](evyn.info).
- Paste your API key in. (You only have to do this once, it will be saved in your browser's local storage)
- Type your prompt and generate!

## Features

- See your image generation history.
- Fully client-side. Your API key and generated images **never leave the local storage** of your browser.
- Cheaper than a ChatGPT Plus subscription!

## Why

- Bypass the slow and overloaded ChatGPT website.
- [4c (USD)](https://openai.com/pricing#image-models) per Standard, 1024x1024 image generated. If you generate less than 500 images per month, this is much cheaper than a full ChatGPT Plus subscription

## Coming soon

- Select which DALL-E model and resolution to generate with. Draft prompts cheaply before generating with the real deal.
- Sora video generation support when the API is released.
- Language model support (maybe). Use ChatGPT through the API for cheaper and faster results without the bloat of the offical chat site.
- Audio transcription model support?

## Tech stack

This project was created with the [T3](https://create.t3.gg) stack. I highly reccommend it for rapid development and scalability. The first working draft of this app was built and published in under 40 minutes.

- [bun](https://bun.sh)
  - Just better than Node.js in every way.
- [Next.js](https://nextjs.org)
  - The best React based framework.
- [tailwindcss](https://tailwindcss.com)
  - My only way to cope with CSS. Develop so much faster with this, must have in every project.
- [Vercel](https://vercel.com)
  - Take the pain out of publishing. Made by the Next.js team so it works together flawlessly.

That's it really. Enjoy!
