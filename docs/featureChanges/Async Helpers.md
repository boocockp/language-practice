# Async Helpers

## Overview

This change affects the [Practice Questions](../features/Practice Questions.md) feature.  
The sections affected are 'Generating data for the question' and 'Generate question and answer'
It reverses an earlier decision and introduces the handlebars-async-helpers package.  
This will make the data and question/answer templates easier for users to write, and also allow more capabilities.

**Implemented.** See Practice Questions.md for the current behaviour (single async Handlebars instance, line-by-line data step, data-expression as template or storeData).

## Requirements

- Wrap Handlebars instances in an asyncHelpers - see docs for handlebars-async-helpers
- All helpers must await all of their arguments before proceeding, to allow async helpers to be used as subexpressions for other helpers
- Await each Handlebars template evaluation
- storeData now stores the results of data-expression in the context passed to the template for each line
- The same context is used with each data template line in turn, so values from earlier lines can be used in later lines
- The same Handlebars instance is used for both data template evaluation and question and answer template evaluation
- All the helpers used by the data template and question/answer templates are registered in this Handlebars instance so they are available in each template
- A data-expression can now be processed in two ways:
    - If it contains a pair of left braces anywhere, treat it as a template, evaluate the template using the data template context, and store the resulting string under the associated name in the context
    - If it contains no braces, process as now - wrap it in a storeData expression which stores the result in the context

