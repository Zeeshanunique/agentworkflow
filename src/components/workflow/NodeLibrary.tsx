import React, { useState } from "react";
import { NodeCategory } from "../../types";
import { renderN8nIcon } from "../../data/n8nNodeTypes";
import { ChevronDown, ChevronRight } from "lucide-react";

interface NodeLibraryProps {
  categories: NodeCategory[];
  onNodeAdd: (nodeType: string) => void;
}

export const NodeLibrary: React.FC<NodeLibraryProps> = ({
  categories,
  onNodeAdd,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    categories.map((cat) => cat.id),
  );

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <div
          key={category.id}
          className="border border-border rounded-lg overflow-hidden shadow-sm"
        >
          <button
            className="w-full p-3 bg-muted/40 text-left flex justify-between items-center cursor-pointer hover:bg-muted/70 transition-colors duration-200"
            onClick={() => toggleCategory(category.id)}
          >
            <span className="font-medium">{category.name}</span>
            <span>
              {expandedCategories.includes(category.id) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </span>
          </button>

          {expandedCategories.includes(category.id) && (
            <div className="px-3 py-2 space-y-1.5 bg-background/80">
              {category.nodes.map((node) => (
                <button
                  key={node.type}
                  className="w-full p-2.5 text-left flex items-center gap-3 rounded-md hover:bg-accent/90 cursor-pointer transition-all duration-200 hover:shadow-sm"
                  onClick={() => onNodeAdd(node.type)}
                >
                  <span
                    className={`p-1.5 rounded ${node.colorClass} flex items-center justify-center`}
                  >
                    {renderN8nIcon(node.icon)}
                  </span>
                  <div className="flex-1">
                    <span className="block text-sm font-medium">
                      {node.name}
                    </span>
                    <span className="block text-xs text-muted-foreground truncate">
                      {node.description}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {categories.length === 0 && (
        <div className="text-center p-4 text-muted-foreground">
          No nodes found.
        </div>
      )}
    </div>
  );
};
