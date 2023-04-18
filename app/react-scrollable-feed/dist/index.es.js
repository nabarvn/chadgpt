import { createElement, createRef, Component } from 'react';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

function styleInject(css, ref) {
  if ( ref === void 0 ) ref = {};
  var insertAt = ref.insertAt;

  if (!css || typeof document === 'undefined') { return; }

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css_248z = ".styles_scrollable-div__prSCv {\r\n  max-height: inherit;\r\n  height: inherit;\r\n  overflow-y: auto;\r\n}\r\n";
var styles = {"scrollable-div":"styles_scrollable-div__prSCv","scrollableDiv":"styles_scrollable-div__prSCv"};
styleInject(css_248z);

var ScrollableFeed = /** @class */ (function (_super) {
    __extends(ScrollableFeed, _super);
    function ScrollableFeed(props) {
        var _this = _super.call(this, props) || this;
        _this.bottomRef = createRef();
        _this.wrapperRef = createRef();
        _this.handleScroll = _this.handleScroll.bind(_this);
        return _this;
    }
    ScrollableFeed.prototype.getSnapshotBeforeUpdate = function () {
        if (this.wrapperRef.current && this.bottomRef.current) {
            var viewableDetectionEpsilon = this.props.viewableDetectionEpsilon;
            return ScrollableFeed.isViewable(this.wrapperRef.current, this.bottomRef.current, viewableDetectionEpsilon); //This argument is passed down to componentDidUpdate as 3rd parameter
        }
        return false;
    };
    ScrollableFeed.prototype.componentDidUpdate = function (previousProps, _a, snapshot) {
        var _b = this.props, forceScroll = _b.forceScroll, changeDetectionFilter = _b.changeDetectionFilter;
        var isValidChange = changeDetectionFilter(previousProps, this.props);
        if (isValidChange && (forceScroll || snapshot) && this.bottomRef.current && this.wrapperRef.current) {
            this.scrollParentToChild(this.wrapperRef.current, this.bottomRef.current);
        }
    };
    ScrollableFeed.prototype.componentDidMount = function () {
        //Scroll to bottom from the start
        if (this.bottomRef.current && this.wrapperRef.current) {
            this.scrollParentToChild(this.wrapperRef.current, this.bottomRef.current);
        }
    };
    /**
     * Scrolls a parent element such that the child element will be in view
     * @param parent
     * @param child
     */
    ScrollableFeed.prototype.scrollParentToChild = function (parent, child) {
        var viewableDetectionEpsilon = this.props.viewableDetectionEpsilon;
        if (!ScrollableFeed.isViewable(parent, child, viewableDetectionEpsilon)) {
            //Source: https://stackoverflow.com/a/45411081/6316091
            var parentRect = parent.getBoundingClientRect();
            var childRect = child.getBoundingClientRect();
            //Scroll by offset relative to parent
            var scrollOffset = (childRect.top + parent.scrollTop) - parentRect.top;
            var _a = this.props, animateScroll = _a.animateScroll, onScrollComplete = _a.onScrollComplete;
            if (animateScroll) {
                animateScroll(parent, scrollOffset);
                onScrollComplete();
            }
        }
    };
    /**
     * Returns whether a child element is visible within a parent element
     *
     * @param parent
     * @param child
     * @param epsilon
     */
    ScrollableFeed.isViewable = function (parent, child, epsilon) {
        epsilon = epsilon || 0;
        //Source: https://stackoverflow.com/a/45411081/6316091
        var parentRect = parent.getBoundingClientRect();
        var childRect = child.getBoundingClientRect();
        var childTopIsViewable = (childRect.top >= parentRect.top);
        var childOffsetToParentBottom = parentRect.top + parent.clientHeight - childRect.top;
        var childBottomIsViewable = childOffsetToParentBottom + epsilon >= 0;
        return childTopIsViewable && childBottomIsViewable;
    };
    /**
     * Fires the onScroll event, sending isAtBottom boolean as its first parameter
     */
    ScrollableFeed.prototype.handleScroll = function () {
        var _a = this.props, viewableDetectionEpsilon = _a.viewableDetectionEpsilon, onScroll = _a.onScroll;
        if (onScroll && this.bottomRef.current && this.wrapperRef.current) {
            var isAtBottom = ScrollableFeed.isViewable(this.wrapperRef.current, this.bottomRef.current, viewableDetectionEpsilon);
            onScroll(isAtBottom);
        }
    };
    /**
     * Scroll to the bottom
     */
    ScrollableFeed.prototype.scrollToBottom = function () {
        if (this.bottomRef.current && this.wrapperRef.current) {
            this.scrollParentToChild(this.wrapperRef.current, this.bottomRef.current);
        }
    };
    ScrollableFeed.prototype.render = function () {
        var _a = this.props, children = _a.children, className = _a.className;
        var joinedClassName = styles.scrollableDiv + (className ? " " + className : "");
        return (createElement("div", { className: joinedClassName, ref: this.wrapperRef, onScroll: this.handleScroll },
            children,
            createElement("div", { ref: this.bottomRef })));
    };
    ScrollableFeed.defaultProps = {
        forceScroll: false,
        animateScroll: function (element, offset) {
            if (element.scrollBy) {
                element.scrollBy({ top: offset });
            }
            else {
                element.scrollTop = offset;
            }
        },
        onScrollComplete: function () { },
        changeDetectionFilter: function () { return true; },
        viewableDetectionEpsilon: 2,
        onScroll: function () { },
    };
    return ScrollableFeed;
}(Component));

export default ScrollableFeed;
//# sourceMappingURL=index.es.js.map
