import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-center"
      mobileOffset={{ bottom: 16 }}
      offset={16}
      duration={3000}
      gap={8}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg !text-sm !py-3 !px-4 !rounded-xl max-w-[90vw] sm:max-w-sm",
          description: "group-[.toast]:text-muted-foreground !text-xs",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground !text-xs !h-7",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground !text-xs !h-7",
        },
      }}
      {...props}
    />
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export { Toaster, toast };
