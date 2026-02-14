"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = App;
var _jsxRuntime = require("react/jsx-runtime");
function App(props) {
  const {
    user = "Guest",
    title = "React SSR"
  } = props;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "wrap",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h1", {
      children: title
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "card",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("p", {
        children: ["Hello ", /*#__PURE__*/(0, _jsxRuntime.jsx)("b", {
          children: user
        }), " \uD83D\uDC4B"]
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("p", {
        children: ["This component was rendered with ", /*#__PURE__*/(0, _jsxRuntime.jsx)("code", {
          children: "ReactDOMServer.renderToString()"
        }), "."]
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "row",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
          className: "pill",
          children: "Framework: React"
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
          className: "pill",
          children: "SSR: enabled"
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
          className: "pill",
          children: "Engine: DomainEx"
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("p", {
        style: {
          marginTop: 14
        },
        children: ["Try:", " ", /*#__PURE__*/(0, _jsxRuntime.jsx)("a", {
          href: "/react?user=Ezekiel",
          children: "/react?user=Ezekiel"
        })]
      })]
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "card",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
        children: "Other routes:"
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("ul", {
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("li", {
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("a", {
            href: "/vue",
            children: "/vue"
          })
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("li", {
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("a", {
            href: "/vanilla",
            children: "/vanilla"
          })
        })]
      })]
    })]
  });
}