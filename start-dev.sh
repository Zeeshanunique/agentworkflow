#!/bin/bash

# Install all required dependencies
npm install @hookform/resolvers@latest zod@latest @radix-ui/react-slot@latest \
  @radix-ui/react-checkbox@latest @radix-ui/react-dialog@latest @radix-ui/react-toast@latest \
  @radix-ui/react-tabs@latest @radix-ui/react-select@latest @radix-ui/react-label@latest \
  clsx@latest tailwind-merge@latest class-variance-authority@latest \
  react-hook-form@latest reactflow@latest --legacy-peer-deps

# Run the dev server
npm run dev
