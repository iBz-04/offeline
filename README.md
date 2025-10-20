<h1 align="center">
  OmniBot
</h1>

**OMNIBOT** IS a private AI that uses WebGPU to run LLMs natively & privately in your browser, bringing you in-browser AI experience.

# Features

- **In-browser privacy:** All AI models run locally (client side) on your hardware, ensuring that your data is processed only on your pc. No server-side processing!
- **Offline:** Once the initial download of a model is processed, you'll be able to use it without an active internet connection.
- **Chat history:** Access and manage your conversation history.
- **Supports new open-source models:** Chat with popular open-source models such as Gemma, Llama2 & 3 and Mistral!
- **Responsive design:** If your phone supports WebGl, you'll be able to use Chatty just as you would on desktop.
- **Markdown & code highlight:** Messages returned as markdown will be displayed as such & messages that include code, will be highlighted for easy access.
- **Chat with files:** Load files (pdf & all non-binary files supported - even code files) and ask the models questions about them - fully local!
- **Custom memory support:** Add custom instructions/memory to allow the AI to provide better and more personalized responses.
- **Export chat messages:** Seamlessly generate and save your chat messages in either json or markdown format.
- **Voice message support:** Use voice interactions to interact with the models.
- **Regenerate responses:** Not quite the response you were hoping for? Quickly regenerate it without having to write out your prompt again.
- **Light & Dark mode:** Switch between light & dark mode.


# Aim

Omnibot attempts to at bring the functionality from popular AI interfaces such as ChatGPT and Gemini into a in-browser experience.

# Browser support

WebGPU is enabled and supported in both Chrome & Edge. To enable it in Firefox Check the [browser compatibility](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API#browser_compatibility) .


## Install from source

follow the steps below to run locally:

**1. Clone the repository to a directory on your pc via command prompt:**

```
git clone https://github.com/iBz-04/omnibot
```

**2. Install dependencies:**

```
npm install
```

**3. Start the development server:**

```
npm run dev
```

**4. Go to [localhost:3000](http://localhost:3000) !**

## Docker

> [!BEWARE]  
> The Dockerfile is not yet optimized for production environment. but if you want to do it, see [Nextjs example](https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile)

use `docker-compose`:

```
docker compose up
```

> If you've made changes and want to rebuild, you can simply run `docker-compose up --build`

# checklist
- [ ] **Web search:** The ability to use internet websearch (if user wants)

- [ ] **Multiple file embeddings:** The ability to embed multiple files instead of one at a time for each session.



# Hardware requirements

> [!NOTE]  
> To run the models efficiently, you'll need a GPU with enough memory. 7B models require a GPU with about 6GB memory whilst 3B models require around 3GB.
>
> Smaller models might not be able to process file embeddings as efficient as larger ones.

# Credit

OmniBot is built using [HuggingFace](https://huggingface.co/), open source LLMs and [LangChain](https://www.langchain.com/).

