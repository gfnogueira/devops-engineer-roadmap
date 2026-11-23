# Start Here

Welcome. This guide helps you take your first steps in the DevOps Engineer Roadmap. It assumes you are comfortable using a computer, but it does not assume you have used a terminal before. It takes a few minutes to read, and then you go straight to the first activity.

Português (Brasil): [Comece aqui](start-here.pt-BR.md) (draft translation, pending human review).

## What you will do first

You will start with one module, [Safe Terminal File Operations](modules/terminal-file-operations.md). In it you will use a terminal to create a small practice folder, copy and organize a few fictional files, deal with a deliberate mistake, and then clean everything up. Nothing you do there touches your real files.

## Why terminal skills matter

Most servers, automation tools, and cloud services are controlled by typing commands, not by clicking. A terminal is fast and precise, and because it does exactly what you type, it also rewards care. The first module teaches a habit you will keep using: **know where you are, predict what a command will do, run it, and check the result.**

## What you need

- A Linux or macOS computer. The labs have been tested on Linux only; macOS is not yet validated. Windows is not covered.
- An ordinary user account. You do not need administrator access, and you should not use it for these exercises.
- A personal folder you can write to, such as your home folder.
- No cloud account, no paid software, and no real passwords or keys. All data in the exercises is fictional.
- About as much patience as you would bring to any new skill. Durations vary by learner, so go at your own pace.

The Git module also needs Git to be installed already. You will not need it for the first two modules.

## Open a terminal

**macOS:** press Command + Space to open Spotlight, type `Terminal`, and press Return. You can also open Finder, then Applications, then Utilities, then Terminal.

**Linux:** the details depend on your distribution. Look for an application called "Terminal" (or "Console") in your applications menu, or try the keyboard shortcut Ctrl + Alt + T, which works on many desktops.

A window opens with a line of text that waits for you. That line is called the **prompt**.

## What a prompt looks like

The prompt tells you the shell is ready for a command. It differs between computers, but often ends with `$` or `%`. Here is an **illustration only. It is not a lab step**, and the names are made up:

```text
learner@laptop:~$ pwd
/home/learner
```

In this illustration, `learner@laptop:~$` is the prompt. You would type only `pwd` and press Enter. The next line, `/home/learner`, is the **output**: what the computer answers.

## Commands, prompts, and output

- **Do not type the prompt symbol.** When this course shows a command, it leaves out the `$`. Type or paste only the command itself.
- **Commands look like code blocks.** Output, when shown, is usually described in the text or in a "Checkpoint" below the block. Your output may differ in small ways, such as your own folder names.
- **Run one command at a time** unless the module says otherwise. Do not paste a whole lesson at once; some commands fail on purpose, and some ask a question you must answer.
- **Type exactly what you see.** Spaces, quotation marks, and capital letters matter.

## Checkpoints

After most steps the module gives a **Checkpoint**: a short description of what you should see. Compare it with what happened. If it matches, continue. If it does not, do not move on and hope for the best; stop and work out why first.

## What STOP means

Some commands in the labs print a line that begins with `STOP`. It is a safety message from the lab itself: something is not as expected, so the next step could cause harm. When you see it:

1. Do not continue and do not try to force the command to work.
2. Read the message and the checkpoint before it.
3. Look in the module for the matching recovery instructions (see the next section).
4. If you still cannot tell what is wrong, stop the exercise. Stopping is a correct outcome, not a failure.

## Recovery instructions

Every module explains what to do if you are interrupted, close the terminal, or make a mistake. Look for the section on resuming an interrupted session and for the notes about recovery next to the step where things went wrong. Use them instead of starting over blindly, and never delete things "to see if it helps". Cleanup removes only what the lab created.

## Where to keep your notes

The module asks you to record a few things, such as the path of your practice folder. Keep your notes in a normal place **outside the practice folder**, because cleanup deletes that folder. A plain text file in your documents folder works well. Do not write real passwords, keys, or personal information in it.

## How to know you are done

Each module ends with **Completion Criteria**, a list of evidence you should be able to show. Go through it row by row. If evidence for a required item is missing, you have not passed that item yet, so repeat that part. This is **self-assessment**, not a certification, and the project does not check your results.

## Your path

1. **Start now:** [Find a starting directory](modules/terminal-file-operations.md#find-a-starting-directory) in the first module, [Safe Terminal File Operations](modules/terminal-file-operations.md). Read its Overview and Prerequisites first if you have not yet.
2. **Next:** [Local Access and Synthetic Secrets](modules/local-access-and-secrets.md) (who may read or change a file, and what to share).
3. **Then:** [Local Git Change Management](modules/git-change-management.md) (recording and undoing changes). Modules 2 and 3 both need module 1, but not each other, so you can take Git before access if you prefer.

The [Foundations learning path](learning-paths/foundations.md) shows the full picture.

Before you rely on a module's expected outputs, read the **Verification status** at the start of that module. It says what has and has not been tested, and on which systems. The Portuguese versions of the modules are drafts that are waiting for human review.

## Glossary

| Term | Meaning |
| --- | --- |
| Terminal | The window where you type commands and read answers. |
| Shell | The program inside the terminal that reads your commands and runs them. |
| Prompt | The text the shell shows when it is ready for a command, often ending in `$` or `%`. |
| Command | An instruction you type, such as `pwd`. |
| Argument | Extra information given to a command, such as a file name. |
| Output | What a command prints back. |
| Directory | A folder. |
| Path | The address of a file or directory, such as `/home/learner`. |
| Home directory | Your personal folder on the computer. |
| Permission | A rule about who may read, change, or run a file. |
| Secret | Information that must stay private, such as a password or key. The exercises use fake ones. |
| Git | A tool that records the history of changes to files. |
| Repository | A folder whose changes Git records. |
| Checkpoint | A description of what you should see before moving on. |
| Disposable | Safe to delete. Practice folders are disposable. |
