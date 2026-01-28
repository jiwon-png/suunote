sequenceDiagram
  autonumber
  actor U as User
  participant UI as Next.js UI (Client)
  participant R as Router
  participant PC as PostsContext (In-memory)
  participant AC as AppContext (Subjects/Courses/Quiz)
  participant EX as Extractor (Mock OCR/STT)
  participant AI as AI Processor (Mock)
  participant DB as Storage (Supabase in future)

  U->>UI: Open "/" (Login)
  UI->>R: handleLogin()
  R-->>UI: push("/posts")

  U->>UI: View "/posts" (Post List)
  UI->>PC: posts (sorted by createdAt)
  PC-->>UI: render list

  U->>UI: Click "새 학습 글 작성"
  UI->>R: navigate "/posts/new"

  U->>UI: (Optional) Select Subject
  UI->>AC: setSelectedSubjectId(subjectId)

  opt Attach file (pdf/image/audio/video)
    U->>UI: Choose file type + upload
    UI->>EX: extractTextFromFile(file, type)
    EX-->>UI: extractedText (mock)
    UI-->>UI: attachments[] append
  end

  U->>UI: Input title/content + Submit
  UI-->>UI: Combine content + extractedText into combinedContent
  UI->>PC: addPost({title, combinedContent, subjectId, attachments, aiProcessed:false})
  PC-->>UI: newPost{id}

  par AI processing
    UI->>AI: generateAIResult(content) (mock, delay)
    AI-->>UI: aiResult{summary,keyPoints,studyDirection}
  end

  UI->>PC: updatePost(id, {aiProcessed:true, aiResult})
  PC-->>UI: updated

  UI->>R: push(`/posts/${id}`)
  U->>UI: View Post Detail + AI Result

  opt Phase2 hint: course linking
    UI->>AC: courses.find(course.postIds includes postId)
    AC-->>UI: relatedCourse (optional)
  end

  opt Phase2 hint: quiz/복습
    U->>UI: Open Quiz Dialog
    UI->>AC: getQuizForPost(postId)
    AC-->>UI: quiz (cached mock)
    U->>UI: Answer questions + read explanations
  end

  opt Delete post
    U->>UI: Click delete
    UI->>PC: deletePost(id)
    UI->>R: push("/posts")
  end

  Note over PC,DB: 현재는 Context(in-memory). Phase2/실서비스는 Supabase(DB)로 영속화.

flowchart TD
  %% Pages (Next.js App Router)
  A["/ (Login)"] --> B["/posts (Post List)"]
  B --> C["/posts/new<br/>(Create Post + Attachments + AI Submit)"]
  C --> D["/posts/:id<br/>(Detail + AI Result + Quiz)"]
  D --> B

  %% Optional Phase 2 routes
  B --> E["/courses (Course List)"]
  E --> F["/courses/:id (Course Detail)"]
  F --> D

  %% Layouts
  subgraph L["Next.js Layouts"]
    L1["app/layout.tsx<br/>Providers"]
    L2["app/posts/layout.tsx"]
    L3["app/courses/layout.tsx"]
  end

  %% Client State
  subgraph S["Client State"]
    PC["PostsContext<br/>- posts[]<br/>- add / update / delete<br/>(in-memory)"]
    AC["AppContext<br/>- subjects[]<br/>- courses[]<br/>- quiz cache<br/>(in-memory)"]
  end

  %% Feature Services (Mock)
  subgraph M["Mock Services (Phase 1)"]
    EX["Extractor<br/>(OCR / STT Mock)"]
    AI["AI Processor<br/>(Summary / KeyPoints)"]
  end

  %% Future Infrastructure
  subgraph INF["Future Infra (Phase 2)"]
    AUTH["Google OAuth"]
    API["API Routes / Server Actions"]
    DB["Supabase"]
    FILE["File Storage"]
  end

  %% Wiring
  B --> PC
  C --> PC
  D --> PC

  B --> AC
  C --> AC
  D --> AC
  E --> AC
  F --> AC

  C --> EX --> C
  C --> AI --> C

  %% Future (dashed)
  A -.-> AUTH
  C -.-> API -.-> DB
  C -.-> FILE
  D -.-> API

