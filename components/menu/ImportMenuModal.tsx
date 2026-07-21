'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Download, FileText, CircleAlert as AlertCircle, CircleCheck as CheckCircle2, Loader as Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Papa from 'papaparse';

/* -------------------------------------------------------------------------- */
/* TYPES                                                                       */
/* -------------------------------------------------------------------------- */

interface ParsedRow {
  category_name: string;
  subcategory_name: string | null;
  dish_name: string;
  dish_description: string | null;
  dish_price: string | null;
  dish_is_available: string | null;
  variant_name: string | null;
  variant_price: string | null;
}

interface ImportError {
  row: number;
  message: string;
}

interface ImportStats {
  categoriesCreated: number;
  categoriesReused: number;
  subcategoriesCreated: number;
  subcategoriesReused: number;
  dishesCreated: number;
  dishesReused: number;
  variantsCreated: number;
  variantsReused: number;
}

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                   */
/* -------------------------------------------------------------------------- */

const REQUIRED_COLUMNS = [
  'category_name',
  'subcategory_name',
  'dish_name',
  'dish_description',
  'dish_price',
  'dish_is_available',
  'variant_name',
  'variant_price',
];

const SAMPLE_HEADERS = REQUIRED_COLUMNS;

const SAMPLE_ROWS: (string | null)[][] = [
  ['Starters', null, 'Paneer Tikka', 'Grilled cottage cheese with spices', '249', 'TRUE', null, null],
  ['Starters', null, 'Chicken Wings', 'Crispy fried wings', '329', 'TRUE', 'Half', '179'],
  ['Starters', null, 'Chicken Wings', 'Crispy fried wings', '329', 'TRUE', 'Full', '329'],
  ['Main Course', 'Vegetarian', 'Dal Makhani', 'Creamy black lentils', null, 'TRUE', 'Regular', '220'],
  ['Main Course', 'Vegetarian', 'Dal Makhani', 'Creamy black lentils', null, 'TRUE', 'Large', '320'],
  ['Main Course', 'Non-Veg', 'Butter Chicken', 'Tandoori chicken in butter gravy', null, 'TRUE', 'Half', '280'],
  ['Main Course', 'Non-Veg', 'Butter Chicken', 'Tandoori chicken in butter gravy', null, 'TRUE', 'Full', '480'],
  ['Beverages', null, 'Masala Chai', 'Indian spiced tea', '40', 'FALSE', null, null],
];

/* -------------------------------------------------------------------------- */
/* COMPONENT                                                                   */
/* -------------------------------------------------------------------------- */

export function ImportMenuModal({
  open,
  onOpenChange,
  restaurantId,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantId: string | null;
  onImported: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ImportError[]>([]);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<
    'idle' | 'parsing' | 'validating' | 'importing' | 'done' | 'error'
  >('idle');
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---------------------------------------------------------------- */
  /* RESET                                                             */
  /* ---------------------------------------------------------------- */

  const reset = () => {
    setFile(null);
    setParsedRows([]);
    setValidationErrors([]);
    setProgress(0);
    setStatus('idle');
    setImportStats(null);
    setServerError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  /* ---------------------------------------------------------------- */
  /* FILE PARSING                                                     */
  /* ---------------------------------------------------------------- */

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    reset();
    setFile(selected);
    setStatus('parsing');

    Papa.parse<Record<string, unknown>>(selected, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.toLowerCase().trim(),
      complete: (results) => {
        try {
          const json = results.data;

          if (!json || json.length === 0) {
            setValidationErrors([
              { row: 0, message: 'The file contains no data rows.' },
            ]);
            setStatus('error');
            return;
          }

          // Validate headers
          const headers = results.meta.fields?.map((h) => h.toLowerCase().trim()) || [];
          const missing = REQUIRED_COLUMNS.filter(
            (c) => !headers.includes(c)
          );

          if (missing.length > 0) {
            setValidationErrors([
              {
                row: 0,
                message: `Missing required columns: ${missing.join(', ')}. Please download the sample file for the correct format.`,
              },
            ]);
            setStatus('error');
            return;
          }

          // Map rows
          const rows: ParsedRow[] = json.map((r) => {
            const get = (key: string): string | null => {
              const val = r[key];
              if (val === null || val === undefined) return null;
              const strVal = String(val).trim();
              return strVal === '' ? null : strVal;
            };

            return {
              category_name: get('category_name') ?? '',
              subcategory_name: get('subcategory_name'),
              dish_name: get('dish_name') ?? '',
              dish_description: get('dish_description'),
              dish_price: get('dish_price'),
              dish_is_available: get('dish_is_available'),
              variant_name: get('variant_name'),
              variant_price: get('variant_price'),
            };
          });

          setParsedRows(rows);
          setStatus('validating');
          setProgress(30);

          // Client-side pre-validation (server is source of truth)
          const errors = validateClient(rows);
          if (errors.length > 0) {
            setValidationErrors(errors);
            setStatus('error');
            setProgress(0);
          } else {
            setProgress(50);
            setStatus('idle');
          }
        } catch (err) {
          console.error('Parse error:', err);
          setServerError('Failed to parse the CSV file. Please ensure it is a valid CSV file.');
          setStatus('error');
        }
      },
      error: (error) => {
        console.error('PapaParse error:', error);
        setServerError(`Failed to parse the CSV file: ${error.message}`);
        setStatus('error');
      },
    });
  };

  /* ---------------------------------------------------------------- */
  /* CLIENT VALIDATION                                                 */
  /* ---------------------------------------------------------------- */

  const validateClient = (rows: ParsedRow[]): ImportError[] => {
    const errors: ImportError[] = [];
    const boolRe = /^(true|false|yes|no|1|0)$/i;

    rows.forEach((row, index) => {
      const rowNum = index + 2;
      const hasVariant =
        row.variant_name && row.variant_name.length > 0;

      if (!row.category_name) {
        errors.push({ row: rowNum, message: 'Category name is required.' });
      }

      if (!row.dish_name) {
        errors.push({ row: rowNum, message: 'Dish name is required.' });
      }

      if (!hasVariant) {
        if (!row.dish_price) {
          errors.push({
            row: rowNum,
            message: 'Dish price is required when no variant is specified.',
          });
        } else if (isNaN(Number(row.dish_price)) || Number(row.dish_price) < 0) {
          errors.push({
            row: rowNum,
            message: `Invalid dish price "${row.dish_price}".`,
          });
        }
      }

      if (hasVariant) {
        if (!row.variant_price) {
          errors.push({
            row: rowNum,
            message: 'Variant price is required when variant name is provided.',
          });
        } else if (isNaN(Number(row.variant_price)) || Number(row.variant_price) < 0) {
          errors.push({
            row: rowNum,
            message: `Invalid variant price "${row.variant_price}".`,
          });
        }
      }

      if (
        row.dish_is_available &&
        row.dish_is_available !== '' &&
        !boolRe.test(row.dish_is_available)
      ) {
        errors.push({
          row: rowNum,
          message: `Invalid availability value "${row.dish_is_available}". Use TRUE or FALSE.`,
        });
      }

      if (
        (!row.category_name || row.category_name === '') &&
        row.subcategory_name &&
        row.subcategory_name !== ''
      ) {
        errors.push({
          row: rowNum,
          message: 'Subcategory provided without a category.',
        });
      }
    });

    return errors;
  };

  /* ---------------------------------------------------------------- */
  /* IMPORT                                                            */
  /* ---------------------------------------------------------------- */

  const handleImport = async () => {
    if (!restaurantId || parsedRows.length === 0) return;

    setStatus('importing');
    setProgress(60);
    setValidationErrors([]);
    setServerError(null);

    try {
      const res = await fetch('/api/import/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          rows: parsedRows,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.validationErrors) {
          setValidationErrors(data.validationErrors);
          setStatus('error');
          setProgress(0);
        } else {
          setServerError(data.error || 'Import failed');
          setStatus('error');
          setProgress(0);
        }
        return;
      }

      setProgress(100);
      setStatus('done');
      setImportStats(data.stats);
      toast.success('Menu imported successfully');
      onImported();
    } catch (err: any) {
      setServerError(err?.message || 'Import failed');
      setStatus('error');
      setProgress(0);
    }
  };

  /* ---------------------------------------------------------------- */
  /* SAMPLE DOWNLOAD                                                   */
  /* ---------------------------------------------------------------- */

  const downloadSample = () => {
    const csvData = Papa.unparse({
      fields: SAMPLE_HEADERS,
      data: SAMPLE_ROWS,
    });

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, 'menu-import-sample.csv');
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /* ---------------------------------------------------------------- */
  /* RENDER                                                             */
  /* ---------------------------------------------------------------- */

  const isImporting = status === 'importing';
  const hasErrors = validationErrors.length > 0 || serverError !== null;
  const canImport =
    parsedRows.length > 0 &&
    !hasErrors &&
    status !== 'importing' &&
    status !== 'done';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl w-[95%] max-h-[85vh] overflow-hidden flex flex-col rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Menu
          </DialogTitle>
          <DialogDescription>
            Bulk import categories, subcategories, dishes, and variants from a CSV file.
            Existing records are reused — no duplicates are created.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-5">
            {/* SAMPLE DOWNLOAD */}
            <div>
              <p className="text-sm font-medium mb-2">Download sample file</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadSample}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Sample CSV
                </Button>
              </div>
            </div>

            {/* FILE UPLOAD */}
            <div>
              <p className="text-sm font-medium mb-2">Upload file</p>
              <label
                htmlFor="import-file-input"
                className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <Upload className="w-8 h-8 text-slate-400" />
                <span className="text-sm text-slate-600">
                  {file ? file.name : 'Click to select CSV file'}
                </span>
                <span className="text-xs text-slate-400">
                  Supported: .csv
                </span>
              </label>
              <input
                id="import-file-input"
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* PROGRESS */}
            {progress > 0 && status !== 'idle' && (
              <div className="space-y-1">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {status === 'parsing' && 'Parsing file…'}
                  {status === 'validating' && 'Validating rows…'}
                  {status === 'importing' && 'Importing menu…'}
                  {status === 'done' && 'Import complete!'}
                  {status === 'error' && 'Import failed.'}
                </p>
              </div>
            )}

            {/* PARSED ROW COUNT */}
            {parsedRows.length > 0 && !hasErrors && status !== 'done' && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {parsedRows.length} rows ready
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Validation passed
                </span>
              </div>
            )}

            {/* VALIDATION ERRORS */}
            {validationErrors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-sm font-medium">
                    {validationErrors.length} validation error{validationErrors.length > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="border border-red-200 rounded-lg bg-red-50 p-3 max-h-40 overflow-y-auto">
                  <ul className="space-y-1 text-sm text-red-700">
                    {validationErrors.slice(0, 50).map((err, i) => (
                      <li key={i}>
                        {err.row > 0 ? `Row ${err.row}: ` : ''}
                        {err.message}
                      </li>
                    ))}
                    {validationErrors.length > 50 && (
                      <li className="italic">
                        …and {validationErrors.length - 50} more
                      </li>
                    )}
                  </ul>
                </div>
                <p className="text-xs text-muted-foreground">
                  Fix the errors in your file and re-upload. No data was imported.
                </p>
              </div>
            )}

            {/* SERVER ERROR */}
            {serverError && validationErrors.length === 0 && (
              <div className="flex items-center gap-2 text-red-600 border border-red-200 rounded-lg bg-red-50 p-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm">{serverError}</p>
              </div>
            )}

            {/* SUCCESS STATS */}
            {status === 'done' && importStats && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <p className="text-sm font-medium">Import successful</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <StatCard
                    label="Categories"
                    created={importStats.categoriesCreated}
                    reused={importStats.categoriesReused}
                  />
                  <StatCard
                    label="Subcategories"
                    created={importStats.subcategoriesCreated}
                    reused={importStats.subcategoriesReused}
                  />
                  <StatCard
                    label="Dishes"
                    created={importStats.dishesCreated}
                    reused={importStats.dishesReused}
                  />
                  <StatCard
                    label="Variants"
                    created={importStats.variantsCreated}
                    reused={importStats.variantsReused}
                  />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* FOOTER */}
        <DialogFooter className="border-t pt-4">
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isImporting}
              className="flex-1"
            >
              {status === 'done' ? 'Close' : 'Cancel'}
            </Button>
            <Button
              onClick={handleImport}
              disabled={!canImport}
              className="flex-1"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing…
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Import
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* STAT CARD                                                                   */
/* -------------------------------------------------------------------------- */

function StatCard({
  label,
  created,
  reused,
}: {
  label: string;
  created: number;
  reused: number;
}) {
  return (
    <div className="border rounded-lg p-3 bg-slate-50">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-green-600">
          {created} new
        </span>
        {reused > 0 && (
          <span className="text-xs text-muted-foreground">
            ({reused} reused)
          </span>
        )}
      </div>
    </div>
  );
}
