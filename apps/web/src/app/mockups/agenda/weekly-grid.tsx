"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const HOURS = Array.from({ length: 15 }, (_, i) => 8 + i); // 8 a 22 h

/** Disponibilidad inicial de ejemplo: clave `día-hora`. */
const INITIAL = new Set(["0-18", "0-19", "2-18", "2-19", "2-20", "4-10", "4-11", "5-10", "5-11", "5-12"]);

/**
 * Grilla semanal (propuesta de D-07): el profesor marca las horas en las que da clases.
 * Al guardar, la API (BE-02) genera los horarios reservables de las próximas 4 semanas.
 */
export default function WeeklyGrid() {
  const [selected, setSelected] = useState(INITIAL);

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-sm">
        <table className="w-full min-w-[560px] border-collapse text-xs">
          <caption className="sr-only">Horas disponibles por día de la semana</caption>
          <thead>
            <tr>
              <th className="w-14 p-2" />
              {DAYS.map((d) => (
                <th key={d} scope="col" className="p-2 font-semibold text-brand-navy">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((h) => (
              <tr key={h} className="border-t border-border">
                <th scope="row" className="p-1 text-right font-normal text-muted-foreground">
                  {h}:00
                </th>
                {DAYS.map((d, di) => {
                  const key = `${di}-${h}`;
                  const on = selected.has(key);
                  return (
                    <td key={key} className="p-0.5">
                      <button
                        type="button"
                        onClick={() => toggle(key)}
                        aria-pressed={on}
                        aria-label={`${d} ${h}:00`}
                        className={cn(
                          "h-7 w-full rounded transition-colors",
                          on ? "bg-brand-orange text-white" : "bg-muted hover:bg-accent",
                        )}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {selected.size} horas por semana · tocá una celda para marcarla o desmarcarla.
      </p>
    </div>
  );
}
