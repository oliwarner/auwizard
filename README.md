Ask Ubuntu Wizard Userscript
========

This is a pilot wizard to test the viability of a first-line wizard 
on the /ask/ page. The project is by Oli, one of the AU moderators.

I'm looking for people to help build out the `wizard_data` JSON inside the wizard. 
This is what really drives the whole project. And here's how it works.

 - The whole thing revolves around a series of "steps".
 - Each step has a `handler`
 - Each handler *can* expect further data. Some dont.
 - Each handler can specify tags that apply to that stage.
 - Each handler can add data to a post that's being built in the background.
 - At the end of the wizard (or if the user hits the `ask` handler) the post and the tags are applied to the real form.

The handlers and their expectations:

 - `choice` expects an array of choices (each one is a step) and each choice can have a `choice` string (big text) and `choice_description` (subtitle).
 - `hardware_picker` is designed to pick one vendor/device ID and search AU for it. It expects a `code` string to tell the user to run a command (and correctly label it in the post).
 - `commands` expects `commands` (an array of strings) that you expect the user to run. It collects this, formats it and adds it to the post.
 - `graphics_picker` is a specialised handler. It will ask the user for their lspci strings and will look for a handler it's passed in `outcomes` (eg `intel`) and run that. This allows the system to fork out based on a specific brand of hardware.
 - `qa` expects `qa` (an integer or string of an integer) that represents an Ask Ubuntu Question. This will display on the screen and ask the user if it helped. We can use this lots to drive people to mega-questions. Also has a `fail` handler for if the question doesn't help to allow us to collect more data.
 
All handlers accept a `tags` argument (an array of strings representing AU tags) 
which will be added to the post. If there are more than 5 appended, the first 
tags are removed. And many handlers accept a `fail` handler which determines what
happens if they didn't progress with the current handler.
 

