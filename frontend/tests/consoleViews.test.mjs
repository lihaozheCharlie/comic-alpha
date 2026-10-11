import test from 'node:test';
import assert from 'node:assert/strict';
import {demoSeries, escapeHTML} from '../js/consoleData.js';
import {homeView, seriesView, detailView, historyView, principlesView, singleView, workflowView} from '../js/consoleViews.js';

function fixture() {
  return {
    series: structuredClone(demoSeries), search: '', filter: 'all', sort: 'recent', detailTab: 'chapters', principleSearch: '',
    singlePrompt: '', singleStyle: '日系治愈', singlePages: 3,
    workflow: {mode: 'series', step: 1, maxStep: 1, count: 1, pages: 3, direction: '演示方向', outlined: false, outlines: [], reviewIndex: 0, generated: false}
  };
}

test('home provides separate series and standalone entries', () => {
  const html = homeView(fixture());
  assert.match(html, /data-action="series"/);
  assert.match(html, /data-action="single"/);
  assert.match(html, /我的漫画系列/);
  assert.doesNotMatch(html, /最近创作|data-action="choose-series"|data-action="series-menu"/);
  assert.match(html, /带入什么/);
});

test('series filtering and search isolate matching series', () => {
  const state = fixture();
  state.search = '灯塔';
  const html = seriesView(state);
  assert.match(html, /data-id="sea"/);
  assert.doesNotMatch(html, /data-id="forest"/);
  state.search = '';
  state.filter = 'planning';
  assert.match(seriesView(state), /data-id="sea"/);
  assert.doesNotMatch(seriesView(state), /data-id="city"/);
});

test('creator text is escaped in series cards and input values', () => {
  const state = fixture();
  state.series[0].name = '<img src=x onerror=alert(1)>';
  assert.doesNotMatch(homeView(state), /<img src=x/);
  assert.match(homeView(state), /&lt;img/);
  state.singlePrompt = '</textarea><script>alert(1)</script>';
  assert.doesNotMatch(singleView(state), /<script>/);
  assert.equal(escapeHTML('"&<>\''), '&quot;&amp;&lt;&gt;&#39;');
});

test('series detail exposes historic comics and separates unconnected canon', () => {
  const state = fixture();
  assert.match(detailView(state, state.series[0]), /data-action="view-comic"/);
  assert.match(detailView(state, state.series[0]), /不编造系列正史/);
  assert.doesNotMatch(detailView(state, state.series[0]), /data-action="detail-tab"/);
  assert.match(historyView(state), /不代表这些示例系列的真实生成历史/);
});

test('principle summaries disclose the missing full private catalog', () => {
  assert.match(principlesView(fixture()), /不宣称已完成全量规则检查/);
});

test('three-step workflow includes principles inline with design', () => {
  const state = fixture();
  const html = workflowView(state, state.series[0]);
  assert.match(html, /ComicBrain 原则与系列上下文/);
  assert.match(html, /未完成真实系列的全量规则复审/);
  assert.match(html, /data-action="outline-preview"/);
  assert.doesNotMatch(html, /rules-read|go-step|保留预览草稿/);
  assert.equal((html.match(/class="step-number"/g)||[]).length, 3);
});

test('review has one approval action without an extra checkbox', () => {
  const state = fixture();
  state.workflow.step = 2;
  state.workflow.outlines = [{title: '示例', summary: '', script: '待填写', notes: '', approved: false}];
  assert.match(workflowView(state, state.series[0]), /data-action="approve-review"/);
  assert.match(workflowView(state, state.series[0]), /确认剧情，进入制作/);
  assert.doesNotMatch(workflowView(state, state.series[0]), /review-approved/);
  state.workflow.outlines.push({title: '第二章', summary: '', script: '待填写', notes: '', approved: false});
  assert.match(workflowView(state, state.series[0]), /确认本章，查看下一章/);
  assert.match(workflowView(state, state.series[0]), /这不会批准 Wiki 正史更新/);
});

test('production preview does not claim real AI generation', () => {
  const state = fixture();
  state.workflow.step = 3;
  state.workflow.generated = true;
  state.workflow.outlines = [{title: '示例', approved: true}];
  const html = workflowView(state, state.series[0]);
  assert.match(html, /非本次 AI 生成/);
  assert.match(html, /\/frontend\/classic.html/);
  assert.match(html, /data-action="export-draft"/);
});
