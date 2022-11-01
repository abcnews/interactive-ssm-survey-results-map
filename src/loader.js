require("es6-promise/auto");
require("isomorphic-fetch");

const arrayFrom = require("array-from");
const Immutable = require("immutable");

import { isMount, getMountValue, selectMounts } from "@abcnews/mount-utils";

function getData() {
  const root = document.querySelector(
    "[data-interactive-marriage-equality-root]"
  );

  function parseCSV(text) {
    let data = {};
    text
      .split("\n")
      .slice(1)
      .forEach((row) => {
        row = row.split(",");
        if (row.length === 2) {
          const name = row[0].replace(/\"/g, "");
          data[name.toUpperCase()] = {
            name: name,
            value: parseFloat(row[1]),
          };
        }
      });
    return Immutable.fromJS(data);
  }

  return fetch(
    root?.getAttribute("data-data-url") ||
      "/cm/code/9153062/ssm-results-electorate-csv.js",
    {
      credentials: "same-origin",
    }
  )
    .then((r) => r.text())
    .then((text) => parseCSV(text))
    .catch((error) => {
      console.error(error);
      return parseCSV(require("./data/fallback-data.csv.js"));
    });
}

// Load any scrollyteller content from Odyssey
let scrollytellers;
function getScrollytellers() {
  const mounts = selectMounts();

  mounts.forEach((mount) => {
    const anchorEl = document.createElement("a");
    anchorEl.name = mount.id;
    anchorEl.innerHTML = " ";

    // replace el with newEL
    mount.parentNode.replaceChild(anchorEl, mount);
  });

  // const x = window.__ODYSSEY__.utils.mounts
  // .getSections("scrollyteller")
  // console.log (x)

  if (!scrollytellers) {
    scrollytellers = window.__ODYSSEY__.utils.mounts
      .getSections("scrollyteller")
      .map((section) => {
        console.log(section)
        section.mountNode = document.createElement("div");
        section.mountNode.className = "u-full";
        section.startNode.parentNode.insertBefore(
          section.mountNode,
          section.startNode
        );

        section.markers = initMarkers(section, "mark");

        return section;
      });
  }
  return scrollytellers;
}

let charts;
function getCharts() {
  if (!charts) {
    charts = arrayFrom(document.querySelectorAll('[name="chart"]')).map(
      (node) => {
        node.mountNode = document.createElement("div");
        node.parentNode.insertBefore(node.mountNode, node);

        return node;
      }
    );
  }
  return charts;
}

// Create markers from actual markers and anything that follows them within the section
function initMarkers(section, name) {
  let markers = [];
  let nextConfig = {};
  let nextNodes = [];

  let idx = 0;

  // Commit the current nodes to a marker
  function pushMarker() {
    if (nextNodes.length === 0) return;

    markers.push({
      idx: idx++,
      config: nextConfig,
      nodes: nextNodes,
      section,
    });
    nextNodes = [];
  }

  // Check the section nodes for markers and marker content
  section.betweenNodes.forEach((node, index) => {
    if (
      node.tagName === "A" &&
      node.getAttribute("name") &&
      node.getAttribute("name").indexOf(name) === 0
    ) {
      // Found a new marker so we should commit the last one
      pushMarker();

      // If marker has no config then just use the previous config
      let configString = node
        .getAttribute("name")
        .replace(new RegExp(`^${name}`), "");
      if (configString) {
        nextConfig = alternatingCaseToObject(configString);
        nextConfig.hash = configString;
      } else {
        // Empty marks should stop the piecemeal flow
        nextConfig.piecemeal = false;
      }
    } else if (!node.mountable) {
      // Any other nodes just get grouped for the next marker
      nextNodes.push(node);
      node.parentNode.removeChild(node);
    }

    // Any trailing nodes just get added as a last marker
    if (index === section.betweenNodes.length - 1) {
      pushMarker();
    }

    // If piecemeal is on/true then each node has its own box
    if (nextConfig.piecemeal) {
      pushMarker();
    }
  });

  return markers;
}

function alternatingCaseToObject(string) {
  const config = string.match(/[A-Z]+[0-9a-z]+/g);

  if (!config) return {};

  let o = {};

  config.forEach((match) => {
    let [, key, value] = match.match(/([A-Z]+)([0-9a-z]+)/);
    key = key.toLowerCase();

    if (o[key]) {
      // Key exists so treat it as a list
      if (!(o[key] instanceof Array)) {
        o[key] = [o[key]];
      }
      o[key].push(value);
    } else {
      o[key] = value;
    }
  });

  return o;
}

// module.exports = { getData, getScrollytellers, getCharts };

export { getData, getScrollytellers, getCharts };
