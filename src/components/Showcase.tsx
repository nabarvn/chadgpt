interface ShowcaseProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: readonly string[];
  isInteractive?: boolean;
  onItemClick?: (item: string) => void;
  isDisabled?: boolean;
}

const Showcase = ({
  icon: Icon,
  title,
  items,
  isInteractive = false,
  onItemClick,
  isDisabled = false,
}: ShowcaseProps) => (
  <div className="mb-9 md:mb-0">
    <div className="mb-5 flex flex-row items-center justify-center space-x-2 md:flex-col md:space-x-0 md:space-y-2">
      <Icon className="h-5 w-5 md:h-7 md:w-7" />
      <h2>{title}</h2>
    </div>

    <div className="space-y-5">
      {items.map((item, index) =>
        isInteractive ? (
          <button
            key={index}
            onClick={() => onItemClick?.(item)}
            disabled={isDisabled}
            className={`infoText block w-full transition-colors duration-200 disabled:opacity-50 ${
              isDisabled
                ? "cursor-default"
                : "cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
            aria-label={`Start chat with: ${item}`}
          >
            &quot;{item}&quot;
          </button>
        ) : (
          <p key={index} className="infoText">
            {item}
          </p>
        ),
      )}
    </div>
  </div>
);

export default Showcase;
