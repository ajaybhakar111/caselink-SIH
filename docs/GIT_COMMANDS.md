# Git commands: from this folder to GitHub

## One-time setup
```bash
git config --global user.name  "Your Name"
git config --global user.email "you@example.com"
```

## Create the repo and push (first time)
Create an empty repository on github.com (no README), then:
```bash
cd caselink
git init
git add .
git commit -m "feat: CaseLink frontend and FastAPI backend"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

## Daily workflow
```bash
git status                       # what changed
git pull                         # get teammates' work first
git checkout -b feature/alerts   # new branch for a feature
git add .
git commit -m "feat: add alert acknowledge"
git push -u origin feature/alerts
```
Then open a Pull Request on GitHub, review, and merge into `main`.

## Useful commands
```bash
git log --oneline --graph        # history
git diff                         # unstaged changes
git restore <file>               # discard changes to a file
git stash / git stash pop        # park changes temporarily
git checkout main && git pull    # return to updated main
git remote -v                    # check remote URL
```

## Teammates
```bash
git clone https://github.com/<your-username>/<repo-name>.git
```

## If push is rejected
```bash
git pull --rebase origin main
git push
```

## Using GitHub CLI instead
```bash
gh auth login
gh repo create <repo-name> --public --source=. --remote=origin --push
```
Never commit `.env`, `node_modules`, `.venv` or `*.db` (already in `.gitignore`).
