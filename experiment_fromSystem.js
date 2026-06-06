(() => {
  "use strict";

  // =========================================================
  // 基本配置
  // =========================================================
  const SAME_KEY = "j";
  const CHANGE_KEY = "f";
  const NEXT_KEY = " ";
  const FIX_DUR = 1000;
  const MEM_DUR = 500;
  const PRACTICE_TRIALS = 15; // 每个练习block的试次
  const PRACTICE_ACC_CRITERION = 0.80;

  const TRIALS_PER_FORMAL_BLOCK = 30;   // 每个小 block 的试次
  const VALID_RATIO_FORMAL = 0.60;
  const VALID_RATIO_PRACTICE = 0.60;
  const CHANGE_RATIO = 0.50;

  const INTERVAL_MIN = 100;
  const INTERVAL_MAX = 1500;

  // fromOthers正式 block 前的连接页
  const CONNECT_MIN = 3000;
  const CONNECT_MAX = 8000;

  // 练习阶段不操纵 SOA，固定 550ms
  const PRACTICE_SOA = 550;
  const FORMAL_SOA_LEVELS = [200, 550, 1000];

  // 屏幕位置
  const POS_L_X = 0.35;
  const POS_R_X = 0.65;
  const POS_Y = 0.50;
  const STIM_SIZE_RATIO = 0.13;

  // =========================================================
  // 路径与素材
  // =========================================================
  const PATHS = {
    instruction: "InstructionImages",
    memory: "MemoryStimuli",
    cue: "CueStimuli"
  };

  const INSTRUCTION = {
    welcome: `${PATHS.instruction}/welcome.png`,
    procedureA: `${PATHS.instruction}/procedure.png`,
    practiceIntroA: `${PATHS.instruction}/practice_intro.png`,
    formalIntroA: `${PATHS.instruction}/formal_intro.png`,
    procedureB: `${PATHS.instruction}/procedure2.png`,
    practiceIntroB: `${PATHS.instruction}/practice_intro2.png`,
    formalIntroB: `${PATHS.instruction}/formal_intro2.png`,
    practiceFailA: `${PATHS.instruction}/practice_fail.png`,
    practiceFailB: `${PATHS.instruction}/practice_fail2.png`,
    breakImg: `${PATHS.instruction}/break.png`,
    end: `${PATHS.instruction}/end.png`
  };

  const MEM_POOL = [
    `${PATHS.memory}/stim_0089.png`,
    `${PATHS.memory}/stim_0095.png`,
    `${PATHS.memory}/stim_0307.png`,
    `${PATHS.memory}/stim_0395.png`,
    `${PATHS.memory}/stim_0405.png`,
    `${PATHS.memory}/stim_0652.png`,
    `${PATHS.memory}/stim_0797.png`
  ];

  const EMOJI_POOL = [
    `${PATHS.cue}/anger.png`,
    `${PATHS.cue}/calmness.png`,
    `${PATHS.cue}/disgust.png`,
    `${PATHS.cue}/fear.png`,
    `${PATHS.cue}/happiness.png`,
    `${PATHS.cue}/sadness.png`,
    `${PATHS.cue}/surprise.png`
  ];

  const COMPLEX_POOL = [
    `${PATHS.cue}/stim_0001_anger.png`,
    `${PATHS.cue}/stim_0262_happiness.png`,
    `${PATHS.cue}/stim_0806_sadness.png`,
    `${PATHS.cue}/stim_0889_surprise.png`,
    `${PATHS.cue}/stim_circular-041_calmness.png`,
    `${PATHS.cue}/stim_dim1-074_disgust.png`,
    `${PATHS.cue}/stim_dim2-fear.png`
  ];

  // =========================================================
  // 背景灰色
  // =========================================================
  document.body.style.background = "rgb(128,128,128)";
  document.documentElement.style.background = "rgb(128,128,128)";
  document.body.style.margin = "0";
  document.documentElement.style.margin = "0";
  document.body.style.overflow = "hidden";
  document.documentElement.style.overflow = "hidden";

  // =========================================================
  // 初始化
  // =========================================================
  const jsPsych = initJsPsych({
    display_element: "jspsych-target",
    show_progress_bar: false,
    on_finish: () => {
      downloadCSV();
    }
  });

  const STATE = {
    subject: {
      name: "",
      birthdate: "",
      gender: "",
      handedness: ""
    },
    assignedOrder: null,   // AABB / BBAA
    completedConditions: {},
    globalTrialCounter: 0
  };

  // =========================================================
  // 工具函数
  // =========================================================
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function sampleOne(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function sampleWithoutReplacement(arr, n) {
    return shuffle(arr).slice(0, n);
  }

  function repeatItems(items, repeats) {
    const out = [];
    items.forEach(item => {
      for (let i = 0; i < repeats; i++) out.push(item);
    });
    return out;
  }

  function choiceWeighted(totalN, ratioOne, labelOne, labelTwo) {
    const nOne = Math.round(totalN * ratioOne);
    const nTwo = totalN - nOne;
    return shuffle([
      ...Array(nOne).fill(labelOne),
      ...Array(nTwo).fill(labelTwo)
    ]);
  }

  function getStimSizePx() {
    return Math.round(window.innerHeight * STIM_SIZE_RATIO);
  }

function makeImageStage(leftSrc = null, rightSrc = null, showFixation = true) {
  const size = getStimSizePx();

  const leftHTML = leftSrc
    ? `<img src="${leftSrc}" style="
          position:absolute;
          left:${POS_L_X * 100}%;
          top:${POS_Y * 100}%;
          transform:translate(-50%, -50%);
          width:${size}px;
          height:${size}px;
          object-fit:contain;
          display:block;
          z-index:2;
        ">`
    : "";

  const rightHTML = rightSrc
    ? `<img src="${rightSrc}" style="
          position:absolute;
          left:${POS_R_X * 100}%;
          top:${POS_Y * 100}%;
          transform:translate(-50%, -50%);
          width:${size}px;
          height:${size}px;
          object-fit:contain;
          display:block;
          z-index:2;
        ">`
    : "";

  const fixationHTML = showFixation
    ? `<div style="
          position:absolute;
          left:50%;
          top:50%;
          transform:translate(-50%, -50%);
          color:#000000;
          font-size:50px;
          line-height:1;
          z-index:1;
          pointer-events:none;
        ">+</div>`
    : "";

  return `
    <div style="
      position:relative;
      width:100vw;
      height:100vh;
      background:rgb(128,128,128);
      overflow:hidden;">
      ${fixationHTML}
      ${leftHTML}
      ${rightHTML}
    </div>
  `;
}

  function makeFixationHTML() {
    return `
      <div style="
        width:100vw;
        height:100vh;
        display:flex;
        align-items:center;
        justify-content:center;
        background:rgb(128,128,128);
        color:#000000;
        font-size:50px;">+</div>
    `;
  }

  function makeTypingHTML(animated = true) {
    if (!animated) {
      return makeFixationHTML();
    }
    return `
      <div style="
        width:100vw;
        height:100vh;
        display:flex;
        align-items:center;
        justify-content:center;
        background:rgb(128,128,128);
        color:#000000;
        font-size:35px;">
        <span>对方正在输入</span><span id="typing-dots">.</span>
      </div>
    `;
  }

  function makeConnectingHTML() {
    return `
      <div style="
        width:100vw;
        height:100vh;
        display:flex;
        align-items:center;
        justify-content:center;
        background:rgb(128,128,128);
        color:#000000;
        font-size:35px;">
        <span>正在与对方连接</span><span id="connecting-dots">.</span>
      </div>
    `;
  }

  function imagePage(file) {
    return {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `
        <div style="
          position:fixed;
          inset:0;
          width:100vw;
          height:100vh;
          margin:0;
          padding:0;
          background:rgb(128,128,128);
          display:flex;
          align-items:center;
          justify-content:center;
          overflow:hidden;
        ">
          <img src="${file}" style="
            width:100vw;
            height:100vh;
            object-fit:contain;
            display:block;
            margin:0;
            padding:0;
            background:rgb(128,128,128);
          ">
        </div>
      `,
      choices: [NEXT_KEY],
      post_trial_gap: 0
    };
  }

  function fullscreenNode() {
    return {
      type: jsPsychFullscreen,
      fullscreen_mode: true,
      message: '<p style="color:#fff; font-size:22px;">实验将进入全屏模式。按下按钮开始。</p>',
      button_label: "进入全屏"
    };
  }

  function demographicsNode() {
    return {
      type: jsPsychSurveyHtmlForm,
      preamble: `
        <div style="width:min(880px,92vw); margin:0 auto; color:#fff;">
          <h2 style="text-align:center;">被试信息</h2>
          <p style="text-align:center;">请填写以下信息，然后点击“开始实验”。</p>
        </div>
      `,
      html: `
        <div style="width:min(880px,92vw); margin:0 auto; color:#fff; font-size:18px;">
          <div style="margin-bottom:16px;">
            <label>姓名 / 编号</label>
            <input name="name" type="text" required
              style="width:100%; font-size:18px; padding:10px; box-sizing:border-box;">
          </div>
          <div style="margin-bottom:16px;">
            <label>出生日期</label>
            <input name="birthdate" type="date" required
              style="width:100%; font-size:18px; padding:10px; box-sizing:border-box;">
          </div>
          <div style="margin-bottom:16px;">
            <label>性别</label>
            <select name="gender" required
              style="width:100%; font-size:18px; padding:10px; box-sizing:border-box;">
              <option value="">请选择</option>
              <option value="Male">男</option>
              <option value="Female">女</option>
              <option value="Other">其他</option>
            </select>
          </div>
          <div style="margin-bottom:16px;">
            <label>利手</label>
            <select name="handedness" required
              style="width:100%; font-size:18px; padding:10px; box-sizing:border-box;">
              <option value="">请选择</option>
              <option value="Right">右利手</option>
              <option value="Left">左利手</option>
              <option value="Both">双手</option>
            </select>
          </div>
        </div>
      `,
      button_label: "开始实验",
      on_finish: (data) => {
        const r = data.response || {};
        STATE.subject.name = String(r.name || "").trim();
        STATE.subject.birthdate = String(r.birthdate || "").trim();
        STATE.subject.gender = String(r.gender || "").trim();
        STATE.subject.handedness = String(r.handedness || "").trim();

        jsPsych.data.addProperties({
          name: STATE.subject.name,
          birthdate: STATE.subject.birthdate,
          gender: STATE.subject.gender,
          handedness: STATE.subject.handedness
        });
      }
    };
  }

  function preloadNode() {
    return {
      type: jsPsychPreload,
      images: [
        ...Object.values(INSTRUCTION),
        ...MEM_POOL,
        ...EMOJI_POOL,
        ...COMPLEX_POOL
      ],
      max_load_time: 120000,
      continue_after_error: false,
      show_progress_bar: true,
      show_detailed_errors: true
    };
  }

  function connectingPageNode() {
    return {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: makeConnectingHTML(),
      choices: "NO_KEYS",
      trial_duration: randInt(CONNECT_MIN, CONNECT_MAX),
      on_load: () => {
        let dots = 1;
        const el = document.getElementById("connecting-dots");
        window.__connectingTimer = setInterval(() => {
          dots = dots % 3 + 1;
          if (el) el.textContent = ".".repeat(dots);
        }, 300);
      },
      on_finish: () => {
        if (window.__connectingTimer) {
          clearInterval(window.__connectingTimer);
          window.__connectingTimer = null;
        }
      },
      data: {
        screen: "connecting"
      }
    };
  }

  function getConditionConfig(cond) {
    if (cond === "A") {
      return {
        label: "fromOthers",
        procedure: INSTRUCTION.procedureA,
        practiceIntro: INSTRUCTION.practiceIntroA,
        formalIntro: INSTRUCTION.formalIntroA,
        practiceFail: INSTRUCTION.practiceFailA,
        intervalType: "typing"
      };
    }
    return {
      label: "fromSystem",
      procedure: INSTRUCTION.procedureB,
      practiceIntro: INSTRUCTION.practiceIntroB,
      formalIntro: INSTRUCTION.formalIntroB,
      practiceFail: INSTRUCTION.practiceFailB,
      intervalType: "fixation"
    };
  }

  function assignOrder() {
    STATE.assignedOrder = Math.random() < 0.5 ? "AABB" : "BBAA";
  }

  function getConditionFirstOccurrenceOrder() {
    return STATE.assignedOrder === "AABB" ? ["A", "B"] : ["B", "A"];
  }

  function practicePassedFor(cond) {
    return !!STATE.completedConditions[cond];
  }

  function markPracticePassed(cond) {
    STATE.completedConditions[cond] = true;
  }

  // =========================================================
  // 试次生成
  // =========================================================
  function buildTrials({
    conditionCode,
    isPractice,
    nTrials,
    blockName,
    formalBlockIndex = null
  }) {
    let soaList = [];
    if (isPractice) {
      soaList = Array(nTrials).fill(PRACTICE_SOA);
    } else {
      const repeats = nTrials / FORMAL_SOA_LEVELS.length;
      soaList = shuffle(repeatItems(FORMAL_SOA_LEVELS, repeats));
    }

    const validityRatio = isPractice ? VALID_RATIO_PRACTICE : VALID_RATIO_FORMAL;
    const validityList = choiceWeighted(nTrials, validityRatio, "valid", "invalid");
    const changeList = choiceWeighted(nTrials, CHANGE_RATIO, "change", "nochange");

    const out = [];

    for (let i = 0; i < nTrials; i++) {
      const [memL, memR] = sampleWithoutReplacement(MEM_POOL, 2);

      const emoji_fn = sampleOne(EMOJI_POOL);
      const stim_fn = sampleOne(COMPLEX_POOL);

      const emojiSide = Math.random() < 0.5 ? "left" : "right";
      const complexSide = emojiSide === "left" ? "right" : "left";

      const validity = validityList[i];
      const probeSide = validity === "valid" ? emojiSide : complexSide;

      const ischange = changeList[i];

      let probeStim;
      if (ischange === "nochange") {
        probeStim = probeSide === "left" ? memL : memR;
      } else {
        const candidates = MEM_POOL.filter(x => x !== memL && x !== memR);
        probeStim = sampleOne(candidates);
      }

      const cueLeft = emojiSide === "left" ? emoji_fn : stim_fn;
      const cueRight = emojiSide === "right" ? emoji_fn : stim_fn;

      const probeLeft = probeSide === "left" ? probeStim : null;
      const probeRight = probeSide === "right" ? probeStim : null;

      out.push({
        conditionCode,
        condition: getConditionConfig(conditionCode).label,
        block: blockName,
        formalBlockIndex,
        isPractice,
        soa: soaList[i],
        validity,
        cueSide: emojiSide,
        probeSide,
        ischange,
        memL,
        memR,
        emoji_fn,
        stim_fn,
        cueLeft,
        cueRight,
        probeLeft,
        probeRight,
        probeStim,
        intervalDur: randInt(INTERVAL_MIN, INTERVAL_MAX)
      });
    }

    return out;
  }

  // =========================================================
  // 单试次 timeline
  // =========================================================
  function makeSingleTrialTimeline(trialVars) {
    const conditionConfig = getConditionConfig(trialVars.conditionCode);

    return {
      timeline: [
        {
          type: jsPsychHtmlKeyboardResponse,
          stimulus: makeFixationHTML(),
          choices: "NO_KEYS",
          trial_duration: FIX_DUR,
          data: { screen: "fixation" }
        },

        {
          type: jsPsychHtmlKeyboardResponse,
          stimulus: () => makeImageStage(
            trialVars.memL,
            trialVars.memR
          ),
          choices: "NO_KEYS",
          trial_duration: MEM_DUR,
          data: { screen: "memory" }
        },

        {
          type: jsPsychHtmlKeyboardResponse,
          stimulus: () => makeTypingHTML(conditionConfig.intervalType === "typing"),
          choices: "NO_KEYS",
          trial_duration: trialVars.intervalDur,
          on_load: () => {
            if (conditionConfig.intervalType === "typing") {
              let dots = 1;
              const el = document.getElementById("typing-dots");
              window.__typingTimer = setInterval(() => {
                dots = dots % 3 + 1;
                if (el) el.textContent = ".".repeat(dots);
              }, 300);
            }
          },
          on_finish: () => {
            if (window.__typingTimer) {
              clearInterval(window.__typingTimer);
              window.__typingTimer = null;
            }
          },
          data: { screen: "interval" }
        },

        {
          type: jsPsychHtmlKeyboardResponse,
          stimulus: () => makeImageStage(
            trialVars.cueLeft,
            trialVars.cueRight
          ),
          choices: "NO_KEYS",
          trial_duration: trialVars.soa,
          data: { screen: "cue" }
        },

        {
          type: jsPsychHtmlKeyboardResponse,
          stimulus: () => makeImageStage(
            trialVars.probeLeft,
            trialVars.probeRight
          ),
          choices: [SAME_KEY, CHANGE_KEY],
          trial_duration: 3000,
          response_ends_trial: true,
          on_finish: (data) => {
            const correctKey = trialVars.ischange === "nochange" ? SAME_KEY : CHANGE_KEY;

            data.acc = data.response === correctKey ? 1 : 0;
            data.correctKey = correctKey;
            data.respKey = data.response || "";
            STATE.globalTrialCounter += 1;
            data.globalTrial = STATE.globalTrialCounter;

            data.name = STATE.subject.name;
            data.birthdate = STATE.subject.birthdate;
            data.gender = STATE.subject.gender;
            data.handedness = STATE.subject.handedness;

            data.block = trialVars.block;
            data.isPractice = trialVars.isPractice;
            data.condition = trialVars.condition;
            data.conditionCode = trialVars.conditionCode;
            data.formalBlockIndex = trialVars.formalBlockIndex;
            data.validity = trialVars.validity;
            data.cueSide = trialVars.cueSide;
            data.probeSide = trialVars.probeSide;
            data.ischange = trialVars.ischange;
            data.memL = trialVars.memL;
            data.memR = trialVars.memR;
            data.emoji_fn = trialVars.emoji_fn;
            data.stim_fn = trialVars.stim_fn;
            data.probeStim = trialVars.probeStim;
            data.soa = trialVars.soa;
            data.intervalDur = trialVars.intervalDur;
          },
          data: {
            screen: "probe"
          }
        },

        {
          type: jsPsychHtmlKeyboardResponse,
          stimulus: () => {
            const last = jsPsych.data.get().last(1).values()[0];
            if (last && last.screen === "probe") {
              const sameBlockRows = jsPsych.data.get().filter({
                screen: "probe",
                block: last.block
              }).values();
              last.trial = sameBlockRows.length;
            }
            return `<div style="font-size:1px; color:transparent;"></div>`;
          },
          choices: "NO_KEYS",
          trial_duration: 10,
          data: {
            screen: "trial_index_update"
          }
        }
      ]
    };
  }

  // =========================================================
  // 练习反馈（只在练习阶段出现）
  // =========================================================
  function makePracticeFeedbackTrial() {
    return {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: () => {
        const lastProbe = jsPsych.data.get().filter({ screen: "probe" }).last(1).values()[0];

        if (!lastProbe || !lastProbe.isPractice) {
          return `<div style="font-size:1px; color:transparent;"></div>`;
        }

        const isCorrect = Number(lastProbe.acc) === 1;

        return `
          <div style="
            width:100vw;
            height:100vh;
            display:flex;
            align-items:center;
            justify-content:center;
            background:rgb(128,128,128);
            color:#000000;
            font-size:35px;
          ">
            ${isCorrect ? "恭喜你答对了！" : "很遗憾，你答错了！"}
          </div>
        `;
      },
      choices: "NO_KEYS",
      trial_duration: 800,
      data: {
        screen: "practice_feedback"
      }
    };
  }

  // =========================================================
  // 练习
  // =========================================================
  function practiceLoopNode(cond) {
    const cfg = getConditionConfig(cond);

    const introPages = [
      imagePage(cfg.procedure),
      imagePage(cfg.practiceIntro)
    ];

    const makePracticeBlock = () => {
      const blockName = `practice_${cond}`;
      const practiceTrials = buildTrials({
        conditionCode: cond,
        isPractice: true,
        nTrials: PRACTICE_TRIALS,
        blockName
      });

    return {
  timeline: [
    ...introPages,

    ...(cond === "A" ? [connectingPageNode()] : []),

    {
      timeline: practiceTrials.flatMap(tv => [
        makeSingleTrialTimeline(tv),
        makePracticeFeedbackTrial()
      ])
    },
    {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: () => {
        const rows = jsPsych.data.get().filter({
          screen: "probe",
          block: blockName
        }).last(PRACTICE_TRIALS).values();

        const acc = rows.length
          ? rows.reduce((s, r) => s + (Number(r.acc) || 0), 0) / rows.length
          : 0;

        if (acc >= PRACTICE_ACC_CRITERION) {
          markPracticePassed(cond);
        }

        return `<div style="font-size:1px; color:transparent;"></div>`;
      },
      choices: "NO_KEYS",
      trial_duration: 10,
      data: {
        screen: "practice_check"
      }
    }
  ]
};
    };

    return {
      timeline: [
        makePracticeBlock(),
        {
          timeline: [imagePage(cfg.practiceFail)],
          conditional_function: () => !practicePassedFor(cond)
        }
      ],
      loop_function: () => !practicePassedFor(cond)
    };
  }

  // =========================================================
  // 正式 block（不加练习反馈）
  // =========================================================
  function formalBlockNode(cond, blockIndexWithinCondition, isLastOverall) {
    const cfg = getConditionConfig(cond);
    const blockName = `formal_${cond}${blockIndexWithinCondition}`;

    const formalTrials = buildTrials({
      conditionCode: cond,
      isPractice: false,
      nTrials: TRIALS_PER_FORMAL_BLOCK,
      blockName,
      formalBlockIndex: blockIndexWithinCondition
    });

    const nodes = [];

    if (blockIndexWithinCondition === 1) {
      nodes.push(imagePage(cfg.formalIntro));
    }

    if (cond === "A") {
      nodes.push(connectingPageNode());
    }

    nodes.push({
      timeline: formalTrials.map(tv => makeSingleTrialTimeline(tv))
    });

    if (!isLastOverall) {
      nodes.push(imagePage(INSTRUCTION.breakImg));
    }

    return { timeline: nodes };
  }

  // =========================================================
  // CSV 下载
  // =========================================================
  function csvEscape(v) {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (s.includes('"') || s.includes(",") || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  function formatDateStamp() {
    const d = new Date();
    const pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  }

  function downloadCSV() {
    const rows = jsPsych.data.get().filter({ screen: "probe" }).values();

    const orderedFields = [
      "name",
      "birthdate",
      "gender",
      "handedness",
      "block",
      "trial",
      "globalTrial",
      "isPractice",
      "condition",
      "conditionCode",
      "formalBlockIndex",
      "validity",
      "cueSide",
      "probeSide",
      "ischange",
      "memL",
      "memR",
      "emoji_fn",
      "stim_fn",
      "probeStim",
      "soa",
      "intervalDur",
      "respKey",
      "correctKey",
      "rt",
      "acc"
    ];

    const lines = [];
    lines.push(orderedFields.join(","));
    rows.forEach(r => {
      lines.push(orderedFields.map(f => csvEscape(r[f])).join(","));
    });

    const csv = "\uFEFF" + lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    const safeName = STATE.subject.name ? STATE.subject.name.replace(/[^\w\-]+/g, "_") : "participant";
    a.href = url;
    a.download = `${safeName}_${STATE.assignedOrder}_${formatDateStamp()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  // =========================================================
  // timeline 组装
  // =========================================================
  STATE.assignedOrder = "B_ONLY";

  const timeline = [];
  timeline.push(fullscreenNode());
  timeline.push(preloadNode());
  timeline.push(demographicsNode());
  timeline.push(imagePage(INSTRUCTION.welcome));

  timeline.push(practiceLoopNode("B"));
  timeline.push(formalBlockNode("B", 1, false));
  timeline.push(formalBlockNode("B", 2, true));

  timeline.push(imagePage(INSTRUCTION.end));

  jsPsych.run(timeline);
})();