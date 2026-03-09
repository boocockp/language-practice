Refactor data form pages
========================

Overview
--------

Two data-editing pages follow the same pattern, and more are planned.
It seems that extracting common functionality into a shared component may mnake the code shorter
and more maintainable.
But it is also possible that trying to extract common code would just make everything _more_ complicated, so assess this first.

Requirements
------------

- Inspect the Words page and the Question Types and the Table and Details Form components that each of them use
- Look for repeated code patterns, and also what differs between the pages
- Create components to handle the common parts of the page, the table and details form
- Identify how properties, including child elements, would be used to parameterize these common components
