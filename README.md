# PAMP 
## Projet annuel : project manager

    This is the React + TypeScript + Vite app for the PAMP project.
    It 's a plateform for students and teacher to manage projects.
    Teachers can create promotions, add students (manually or via a file), 
    create projects, manage their details, and oversee deliverables and reports. 
    Students, on the other hand, access the projects created by teachers, 
    can view project information, create groups, submit deliverables, and write reports online. 
    Accounts are automatically created by teachers, and authentication is done via SSO.

## How to run


- In local : 
    - ```npm ci```
    - ```npm run start```
- Prod like with Dockerfile, 
  - run at the root : ```docker build -t pamp-frontend . && docker run -p 80:80 -it pamp-frontend```
      (website will run on port 80 of your machine)
## How to test (with vitest)

```npm run test```

## How to contribute

Create a new branch from main
Always run ```npm run lint:fix``` before commiting to format and check the code.
Then open a PR to merge your new branch on main

### Authors:
- Loriane HILDERAL
- Clarence HIRSCH
- Malik LAFIA

