import * as React from 'react';
import { ReactNode } from 'react';
export declare type ScrollableFeedProps = {
    forceScroll?: boolean;
    animateScroll?: (element: HTMLElement, offset: number) => void;
    onScrollComplete?: () => void;
    changeDetectionFilter?: (previousProps: ScrollableFeedComponentProps, newProps: ScrollableFeedComponentProps) => boolean;
    viewableDetectionEpsilon?: number;
    className?: string;
    onScroll?: (isAtBottom: boolean) => void;
};
declare type ScrollableFeedComponentProps = Readonly<{
    children?: ReactNode;
}> & Readonly<ScrollableFeedProps>;
declare class ScrollableFeed extends React.Component<React.PropsWithChildren<ScrollableFeedProps>> {
    private readonly wrapperRef;
    private readonly bottomRef;
    constructor(props: ScrollableFeedProps);
    static defaultProps: ScrollableFeedProps;
    getSnapshotBeforeUpdate(): boolean;
    componentDidUpdate(previousProps: ScrollableFeedComponentProps, {}: any, snapshot: boolean): void;
    componentDidMount(): void;
    /**
     * Scrolls a parent element such that the child element will be in view
     * @param parent
     * @param child
     */
    protected scrollParentToChild(parent: HTMLElement, child: HTMLElement): void;
    /**
     * Returns whether a child element is visible within a parent element
     *
     * @param parent
     * @param child
     * @param epsilon
     */
    private static isViewable;
    /**
     * Fires the onScroll event, sending isAtBottom boolean as its first parameter
     */
    protected handleScroll(): void;
    /**
     * Scroll to the bottom
     */
    scrollToBottom(): void;
    render(): React.ReactNode;
}
export default ScrollableFeed;
