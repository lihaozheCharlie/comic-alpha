export const createDemoPages = () => [
  {
    title: "清晨",
    status: "done",
    panels: [
      "森林小屋，清晨。阳光穿过树叶，落在窗边的桌子上。",
      "门口放着一封来信。镜头聚焦信封。",
      "手拿起信封，停顿片刻。",
      "窗外，森林的小路伸向远方。",
    ],
  },
  {
    title: "来信",
    status: "pending",
    panels: [
      "森林小屋，清晨。\n一封信安静地躺在木桌上，阳光照亮信封的一角。",
      "小狐狸打开信封，看见熟悉的字迹。\n\n对白：“原来，你还记得。”",
      "窗外的树叶轻轻晃动。\n镜头转向窗边，留出安静的停顿。",
      "小狐狸收好信，站在门口。\n画面留下通往森林深处的小路。",
    ],
  },
  {
    title: "出发",
    status: "done",
    panels: [
      "森林里的小路。远景，展示新的场景。",
      "角色走进画面。使用侧面镜头。",
      "一个细节特写，衔接前一个镜头。",
      "角色继续前进。画面留出下一页的悬念。",
    ],
  },
  {
    title: "途中",
    status: "pending",
    panels: [
      "场景建立镜头。",
      "角色的动作特写。",
      "角色观察周围。",
      "转场镜头。",
    ],
  },
  {
    title: "重逢",
    status: "pending",
    panels: [
      "展示本页场景。",
      "角色进入场景。",
      "对话镜头，留出对白空间。",
      "收束本页的画面。",
    ],
  },
  {
    title: "回信",
    status: "pending",
    panels: [
      "安静的环境镜头。",
      "角色写下回信。",
      "信封的近景。",
      "故事结束，镜头拉远。",
    ],
  },
];
export const sampleImage = "/assets/examples/doraemon-sample-comic_cn.png";
export const icons = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1"/>',
  export: '<path d="M12 16V3m-4 4 4-4 4 4M4 15v5h16v-5"/>',
  import: '<path d="M12 3v13m-4-4 4 4 4-4M4 16v5h16v-5"/>',
  image:
    '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 6-6 4 4 3-3 5 5"/>',
  book: '<path d="M12 5v16M3 4c4-1 6-1 9 1 3-2 5-2 9-1v15c-4-1-6-1-9 2-3-3-5-3-9-2Z"/>',
  external: '<path d="M14 3h7v7m0-7L10 14M10 3H3v18h18v-7"/>',
  spark:
    '<path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4Z"/>',
  left: '<path d="m14 6-6 6 6 6"/>',
  right: '<path d="m10 6 6 6-6 6"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',
  cursor: '<path d="m4 3 6 17 3-7 7-3Z"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  sliders:
    '<path d="M5 3v7m0 4v7M12 3v12m0 4v2M19 3v2m0 4v12M2 10h6m1 5h6m1-10h6"/>',
};
export const icon = (name) =>
  `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${icons[name] || icons.info}</svg>`;
