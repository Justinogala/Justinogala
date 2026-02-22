
import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { motion } from 'framer-motion';
import React from 'react';

const buttonVariants = cva(
	'inline-flex items-center justify-center rounded-lg text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 touch-none select-none',
	{
		variants: {
			variant: {
				default: 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30 border-0',
				destructive:
          'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20',
				outline:
          'border-2 border-violet-200 dark:border-violet-800 bg-transparent hover:bg-violet-50 dark:hover:bg-violet-900/20 text-violet-700 dark:text-violet-300 hover:border-violet-300 dark:hover:border-violet-700',
				secondary:
          'bg-violet-100 dark:bg-violet-900/40 text-violet-900 dark:text-violet-100 hover:bg-violet-200 dark:hover:bg-violet-900/60 border border-violet-200 dark:border-violet-800',
				ghost: 'hover:bg-violet-50 dark:hover:bg-violet-900/20 text-gray-600 dark:text-gray-300 hover:text-violet-700 dark:hover:text-violet-300',
				link: 'text-violet-600 underline-offset-4 hover:underline',
        gradient: 'bg-gradient-to-r from-violet-700 via-purple-600 to-violet-500 text-white hover:opacity-90 shadow-lg shadow-violet-600/30 hover:shadow-violet-600/40',
        subtle: 'bg-violet-50 text-violet-900 hover:bg-violet-100 dark:bg-violet-900/30 dark:text-violet-100 dark:hover:bg-violet-900/50',
			},
			size: {
				default: 'h-10 px-4 py-2 min-h-[44px]', // Mobile friendly default
				sm: 'h-9 rounded-md px-3 text-xs min-h-[36px]',
				lg: 'h-12 rounded-lg px-8 text-base min-h-[48px]',
				icon: 'h-10 w-10 min-h-[44px] min-w-[44px]',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	const Comp = asChild ? Slot : motion.button;
    
    const motionProps = asChild ? {} : {
        whileHover: { scale: 1.02 },
        whileTap: { scale: 0.96 },
        transition: { type: "spring", stiffness: 400, damping: 17 }
    };

	return (
		<Comp
			className={cn(buttonVariants({ variant, size, className }))}
			ref={ref}
			{...motionProps}
			{...props}
		/>
	);
});
Button.displayName = 'Button';

export { Button, buttonVariants };
