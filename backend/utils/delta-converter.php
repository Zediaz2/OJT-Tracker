<?php
/**
 * Delta to HTML Converter
 * Converts Quill Delta format to HTML for display
 * Supports: bold, italic, underline, alignment, lists, headings, font sizes
 */

class DeltaToHTML {
    private $delta;
    private $ops;
    
    /**
     * Constructor
     * @param mixed $delta Delta object (array) or JSON string
     */
    public function __construct($delta) {
        if (is_string($delta)) {
            $this->delta = json_decode($delta, true);
        } else {
            $this->delta = $delta;
        }
        
        $this->ops = $this->delta['ops'] ?? [];
    }
    
    /**
     * Convert Delta to HTML
     * @return string HTML string
     */
    public function toHTML() {
        if (empty($this->ops)) {
            return '';
        }
        
        $html = '';
        $inParagraph = false;
        $inList = false;
        $listType = null;
        $lastAlign = null;
        $lastSize = null;
        
        foreach ($this->ops as $index => $op) {
            if (!isset($op['insert'])) {
                continue;
            }
            
            $text = $op['insert'];
            $attrs = $op['attributes'] ?? [];
            
            // Handle newlines
            if ($text === "\n") {
                // Check if next op has list attribute
                $nextList = null;
                if ($index + 1 < count($this->ops) && isset($this->ops[$index + 1]['attributes']['list'])) {
                    $nextList = $this->ops[$index + 1]['attributes']['list'];
                }
                
                if (isset($attrs['list']) && $attrs['list']) {
                    // In a list item
                    $html .= '</li>';
                    if (!$nextList || $nextList !== $attrs['list']) {
                        // List is ending
                        $html .= $attrs['list'] === 'ordered' ? '</ol>' : '</ul>';
                        $inList = false;
                        $listType = null;
                    }
                } else {
                    // Regular paragraph
                    if ($inParagraph) {
                        $html .= '</p>';
                        $inParagraph = false;
                    }
                    if ($inList) {
                        $html .= $listType === 'ordered' ? '</ol>' : '</ul>';
                        $inList = false;
                        $listType = null;
                    }
                }
                continue;
            }
            
            // Escape HTML in text
            $text = htmlspecialchars($text, ENT_QUOTES, 'UTF-8');
            
            // Apply inline formatting
            if (isset($attrs['bold']) && $attrs['bold']) {
                $text = "<strong>$text</strong>";
            }
            if (isset($attrs['italic']) && $attrs['italic']) {
                $text = "<em>$text</em>";
            }
            if (isset($attrs['underline']) && $attrs['underline']) {
                $text = "<u>$text</u>";
            }
            
            // Apply size if present
            if (isset($attrs['size']) && $attrs['size']) {
                $text = "<span style=\"font-size:{$attrs['size']};\">$text</span>";
            }
            
            // Handle lists
            if (isset($attrs['list']) && $attrs['list']) {
                if (!$inList || $listType !== $attrs['list']) {
                    if ($inList) {
                        $html .= $listType === 'ordered' ? '</ol>' : '</ul>';
                    }
                    if ($inParagraph) {
                        $html .= '</p>';
                        $inParagraph = false;
                    }
                    $listType = $attrs['list'];
                    $html .= $listType === 'ordered' ? '<ol>' : '<ul>';
                    $inList = true;
                }
                $html .= '<li>';
                if (isset($attrs['align']) && $attrs['align']) {
                    $html .= "<span style=\"display:block; text-align:{$attrs['align']};\">$text</span>";
                } else {
                    $html .= $text;
                }
            } 
            // Handle headers
            elseif (isset($attrs['header']) && $attrs['header']) {
                if ($inParagraph) {
                    $html .= '</p>';
                    $inParagraph = false;
                }
                if ($inList) {
                    $html .= $listType === 'ordered' ? '</ol>' : '</ul>';
                    $inList = false;
                    $listType = null;
                }
                $level = (int)$attrs['header'];
                $html .= "<h$level>$text</h$level>";
            }
            // Regular paragraph
            else {
                if ($inList) {
                    $html .= $listType === 'ordered' ? '</li></ol>' : '</li></ul>';
                    $inList = false;
                    $listType = null;
                }
                
                if (!$inParagraph) {
                    // Check for alignment
                    if (isset($attrs['align']) && $attrs['align'] !== '') {
                        $html .= "<p style=\"text-align:{$attrs['align']};\">$text";
                    } else {
                        $html .= "<p>$text";
                    }
                    $inParagraph = true;
                } else {
                    // Already in paragraph
                    $html .= $text;
                }
            }
        }
        
        // Close any open tags
        if ($inParagraph) {
            $html .= '</p>';
        }
        if ($inList) {
            $html .= $listType === 'ordered' ? '</li></ol>' : '</li></ul>';
        }
        
        return $html;
    }
    
    /**
     * Convert Delta to plain text
     * Strips all formatting and returns only text content
     * @return string Plain text
     */
    public function toPlainText() {
        $text = '';
        foreach ($this->ops as $op) {
            if (isset($op['insert']) && is_string($op['insert'])) {
                $text .= $op['insert'];
            }
        }
        return trim($text);
    }
}

/**
 * Helper function to convert Delta to HTML
 * @param mixed $delta Delta object or JSON string
 * @return string HTML string
 */
function deltaToHTML($delta) {
    $converter = new DeltaToHTML($delta);
    return $converter->toHTML();
}

/**
 * Helper function to convert Delta to plain text
 * @param mixed $delta Delta object or JSON string
 * @return string Plain text
 */
function deltaToPlainText($delta) {
    $converter = new DeltaToHTML($delta);
    return $converter->toPlainText();
}
?>
