
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const BreadcrumbNav = ({ className }) => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <motion.nav 
      aria-label="Breadcrumb" 
      className={cn("flex items-center text-sm text-text-secondary py-4", className)}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <ol className="flex items-center space-x-2">
        <li>
          <Link to="/" className="hover:text-accent transition-colors flex items-center">
            <Home className="w-4 h-4" />
          </Link>
        </li>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const label = value.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

          return (
            <li key={to} className="flex items-center space-x-2">
              <ChevronRight className="w-4 h-4 text-border" />
              {isLast ? (
                <span className="font-medium text-text-primary cursor-default" aria-current="page">
                  {label}
                </span>
              ) : (
                <Link to={to} className="hover:text-accent transition-colors">
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </motion.nav>
  );
};

export default BreadcrumbNav;
