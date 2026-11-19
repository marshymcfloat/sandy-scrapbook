export function NotebookPaper() {
  return (
    <>
      <source
        media="(min-width: 740px)"
        srcSet="/assets/notebook-spread.webp"
      />
      <img
        src="/assets/notebook-page.webp"
        width="720"
        height="1080"
        alt=""
        fetchPriority="high"
      />
    </>
  );
}

export function Sparkles() {
  return (
    <>
      <path
        fill="#ebe0ef"
        d="M20 6 C22 14 26 17 34 18 C27 20 24 25 23 33 C20 26 15 23 8 23 C15 20 19 15 20 6Z"
      />
      <path d="M43 30 Q44 36 49 38 Q44 39 43 45 Q42 40 37 38 Q42 36 43 30Z" />
    </>
  );
}

export function GateLettering() {
  return (
    <>
      <svg
        className="gate-signature"
        viewBox="0 0 312 170"
        width="312"
        height="170"
        fill="none"
        stroke="currentColor"
        strokeWidth="5.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path
          pathLength="1"
          d="M52 30 C70 9 48 8 30 17 C10 27 10 37 27 41 C46 45 56 48 47 61 C38 75 8 79 7 68 C6 62 14 58 22 57"
        />
        <path
          pathLength="1"
          d="M49 62 C63 48 78 42 80 49 C81 56 68 70 61 67 C51 62 70 44 80 49 C78 57 71 66 79 66 C86 66 96 53 102 48 C99 55 95 63 94 67 C103 56 112 46 119 48 C124 51 111 64 118 66 C126 68 138 52 145 49 C156 44 155 53 148 61 C141 70 129 69 134 59 C139 49 150 46 155 50 C162 38 174 16 170 15 C164 13 150 48 148 59 C144 77 160 62 170 51 C166 61 164 68 171 66 C181 63 189 48 192 48 C189 60 174 91 164 92 C150 93 169 73 189 65 C199 61 204 55 209 48"
        />
        <path pathLength="1" strokeWidth="4.5" d="M213 33 Q217 29 219 24" />
        <path
          pathLength="1"
          d="M208 49 C214 41 221 43 215 49 C210 55 223 59 216 65 C209 71 200 65 207 63 C218 64 227 58 233 54"
        />
        <path
          pathLength="1"
          d="M53 113 C72 93 49 92 31 101 C13 110 12 120 29 124 C49 128 57 132 48 144 C38 157 9 161 8 151 C7 145 15 141 23 140"
        />
        <path
          pathLength="1"
          d="M50 145 C61 136 72 129 77 132 C79 137 68 141 66 138 C58 146 60 154 69 152 C77 151 87 142 94 133 C97 128 99 126 101 128 C103 131 94 137 99 138 C105 139 111 134 115 132 C108 141 101 152 108 152 C115 152 123 141 130 136 C140 128 149 130 146 136 C141 145 130 156 125 150 C120 145 137 130 146 133 C141 143 137 153 144 151 C152 148 159 138 165 131 C159 146 152 161 151 166 C156 153 167 133 176 131 C185 129 182 142 173 148 C166 153 160 152 159 148"
        />
        <path
          pathLength="1"
          d="M176 148 C192 143 215 103 208 101 C201 98 182 143 184 151 C186 159 202 145 205 137 C206 129 196 131 192 137 C202 139 214 140 222 134 C215 131 210 142 212 149 C216 158 229 147 231 138 C233 129 222 130 220 136 C230 142 242 139 249 133 C242 129 235 142 238 149 C242 157 255 146 257 137 C258 129 248 131 246 136 C255 141 268 137 273 132 C282 122 293 98 289 99 C283 98 268 132 263 150 C273 141 284 129 291 132 C297 137 276 141 274 143 C278 152 289 154 303 142"
        />
      </svg>
    </>
  );
}

export function GateDoodles() {
  return (
    <>
      <div className="gate-doodles" aria-hidden="true">
        <svg
          className="gate-doodle-arrow"
          viewBox="0 0 88 76"
          focusable="false"
        >
          <path
            pathLength="1"
            d="M5 8 C29 9 51 22 49 38 C47 51 25 50 20 38 C16 24 38 23 55 35 C70 45 79 57 82 70 M69 63 Q76 65 82 70 Q85 63 86 55"
          />
        </svg>
        <svg
          className="gate-doodle-hearts"
          viewBox="0 0 62 56"
          focusable="false"
        >
          <path
            fill="#edc1c6"
            d="M21 32 C13 26 3 13 8 7 C13 1 20 6 23 14 C28 7 35 5 38 10 C43 18 31 28 21 32Z"
          />
          <path
            fill="#f4dce6"
            d="M48 49 C41 45 37 38 42 35 C45 33 50 36 51 39 C54 33 59 34 60 38 C62 42 54 48 48 49Z"
          />
        </svg>
        <svg
          className="gate-doodle-sparkles"
          viewBox="0 0 54 50"
          focusable="false"
        >
          <Sparkles />
        </svg>
        <svg className="gate-doodle-loop" viewBox="0 0 88 54" focusable="false">
          <path
            pathLength="1"
            d="M4 30 C7 48 22 50 39 40 C53 31 56 18 49 12 C42 5 30 15 30 26 C30 37 43 41 53 39 C67 36 80 22 82 5"
          />
        </svg>
      </div>
    </>
  );
}
