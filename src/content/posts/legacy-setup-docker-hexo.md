---
title: "[Docker] Hexo 블로그를 Docker로 설정 및 배포하기"
description: "컨테이너 쉘에 접속하여 여러 명령어를 실행할 수 있습니다:"
date: "2025-01-03"
tags: []
category: "docker"
origin: "hexo"
legacyUrl: "/2025/01/03/setup_docker_hexo/"
---
<!-- hexo-import:v1 sha256=d65c035014367b48032530b6cae107fa2fd5799f3938863350b83fd67fb6f24a -->

![](/legacy-assets/images/thumbnail/docker.jpg)

<span id="Hexo-블로그를-Docker로-설정-및-배포하기"></span>

## Hexo 블로그를 Docker로 설정 및 배포하기

### 1\. 준비사항

-   GitHub 레포지토리 3개:
    1.  배포된 사이트 (`username.github.io`) - [https://ruby-kim.github.io/2022/04/07/Hexo/Install/](https://ruby-kim.github.io/2022/04/07/Hexo/Install/)
    2.  블로그 소스 코드 (`hexo-blog-source`) - [https://ruby-kim.github.io/2022/04/15/Hexo/Backup/](https://ruby-kim.github.io/2022/04/15/Hexo/Backup/)
    3.  테마 백업 (`hexo-blog-theme`) - [https://ruby-kim.github.io/2022/04/15/Hexo/Backup/](https://ruby-kim.github.io/2022/04/15/Hexo/Backup/)

<span id="2-Hexo-블로그-클론"></span>

### 2\. Hexo 블로그 클론

-   먼저, GitHub에서 Hexo 블로그를 클론합니다.

```bash
git clone --recursive ".md파일을 저장한 repository 주소" blog
cd blog
```

<span id="3-Dockerfile-작성"></span>

### 3\. Dockerfile 작성

-   클론한 프로젝트 디렉토리 안에 Dockerfile이라는 파일을 만듭니다. 파일 이름은 반드시 Dockerfile이어야 합니다.
    
    ```bash
    touch Dockerfile
    ```
    
-   그런 다음, Dockerfile을 열어서 다음 내용을 작성합니다.
    
    ```dockerfile
    FROM node:lts
    
    # Set the working directory
    WORKDIR /my-hexo
    
    # Change ownership of the npm cache directory
    RUN npm config set cache /home/node/.npm-cache --global
    
    # Install Hexo CLI and hexo-deployer-git globally with --unsafe-perm option
    RUN npm install -g hexo-cli --unsafe-perm \
        && npm install hexo-deployer-git --save
    
    # Copy your blog files into the container
    COPY . .
    
    # Install project dependencies
    RUN npm install
    
    # Install text editors
    RUN apt-get update && apt-get install -y \
        vim \
        && rm -rf /var/lib/apt/lists/*
    
    # Open the necessary port
    EXPOSE 4000
    
    # Entry point to clean and serve the blog
    ENTRYPOINT [ "/bin/bash", "-c", "hexo clean && hexo server -p 4000" ]
    ```
    

<span id="4-build-run-sh-작성"></span>

### 4\. build\_run.sh 작성

```bash
#!/bin/bash

# Build the Docker image
docker build -t my-hexo-blog .

# Check if a container with the name 'hexo-blog' is already running and stop it
if [ $(docker ps -a -q -f name=hexo-blog) ]; then
    docker rm -f hexo-blog
fi

# Run the Docker container
docker run -d -p 4000:4000 --name hexo-blog my-hexo-blog
```

-   사용방법
    1.  스크립트를 build\_and\_run.sh 파일로 저장합니다.
    2.  실행 권한을 부여합니다:
        
        ```bash
        chmod +x build_and_run.sh
        ```
        
    3.  스크립트를 실행합니다:
        
        ```bash
        ./build_and_run.sh
        ```
        

<span id="5-Docker-이미지-빌드-및-푸시"></span>

### 5\. Docker 이미지 빌드 및 푸시

```bash
docker build -t username/my-hexo-blog:latest .
docker push username/my-hexo-blog:latest
```

### 6\. 다른 환경에서 이미지 풀 및 실행

```bash
docker pull username/my-hexo-blog:latest
docker run -d -p 4000:4000 --name hexo-blog username/my-hexo-blog:latest
```

### 7\. 컨테이너 쉘에 접속하여 명령어 실행

컨테이너 쉘에 접속하여 여러 명령어를 실행할 수 있습니다:

```bash
docker exec -it hexo-blog /bin/bash
```

쉘에 접속한 후, 여러 명령어를 연속으로 실행할 수 있습니다:

```bash
hexo clean
hexo generate
hexo server -p 4000
```

<span id="8-로컬에서-작업-및-GitHub에-푸시"></span>

### 8\. 로컬에서 작업 및 GitHub에 푸시

```bash
git add .
git commit -m "Update blog"
git push origin main
```
