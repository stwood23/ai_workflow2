I want you to add a step to the plan (and other documents to match) about how to incorporate snippets into prompt templates.

the idea is in either the raw input modal or the refinement modal of a prompt template i can hit the `@` key and then i can auto complete from the list of existing context snippets that i already have saved into my database. the idea is that we store that relationship in the prompt template (not the raw text from the snippet but just the relationship) and at the moment in time when i ultimately generate a document using a prompt template it will fetch that snippet text and incorporate it as part of the document generation process.

As part of this, we'll need to make sure if it's entered into the raw input that it is still present during the refined output. We should make sure that it's stylized in some way so that way it doesn't just look like plain text with an at symbol, but is stylized in some way where the user can easily navigate to and find it. And in the inputs section of a of the prompt modal, the refinement prompt modal, we should also just denote that the context is included. So maybe there's an inputs in context is the update to the header. And we also put it in that same box, but we denote it with a different color, like a blue. So that way we know it's a little bit different than the other.

As part of this, I'm assuming we'll need to use some kind of rich text editor library. I think we should use lexical (@https://lexical.dev/docs/getting-started/react )

Please update the three documents attached based on your new plan. Do not write any code yet. Just write out your overall approach first, then based on the approach update the plans. For the @plan.md we should assume this phase comes directly after phase 3.

Deeply reflect upon the changes you think are necessary. Draft a comprehensive plan of action and ask me for approval on that plan.
