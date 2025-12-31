'use client';

import * as React from 'react';
import { TrendingUp, Users, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export interface SuiteData {
  pulse?: {
    vitality_score: number;
    developer_activity_score: number;
    team_retention_score: number;
    active_contributors: number;
  };
  trace?: {
    growth_score: number;
    verified_roi: number;
    roi_multiplier: number;
    quality_score: number;
  };
  revenue_verified: number;
  fabrknt_score: number;
}

export interface SuiteRibbonProps {
  listingId: string;
  data?: SuiteData;
  loading?: boolean;
  className?: string;
  onAuditClick?: (view: 'pulse' | 'trace' | 'full') => void;
}

export function SuiteRibbon({
  listingId,
  data,
  loading = false,
  className,
  onAuditClick,
}: SuiteRibbonProps) {
  if (loading) {
    return (
      <div
        className={cn(
          'animate-pulse h-40 bg-gray-100 rounded-xl border border-gray-200',
          className
        )}
      />
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div
      className={cn(
        'bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6',
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Fabrknt Suite Verification
        </h3>
        <div className="flex gap-2">
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
            Verified
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Growth (TRACE) */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-medium text-gray-600">
              Growth (TRACE)
            </span>
            {data.trace && <CheckCircle className="w-4 h-4 text-green-500" />}
          </div>
          {data.trace ? (
            <>
              <div className="text-3xl font-bold text-gray-900">
                {data.trace.growth_score}/100
              </div>
              <div className="text-sm text-gray-500 mt-1">
                ${(data.trace.verified_roi / 1000).toFixed(1)}k ROI
              </div>
              {onAuditClick && (
                <button
                  onClick={() => onAuditClick('trace')}
                  className="text-xs text-blue-600 hover:underline mt-2 text-left"
                >
                  View TRACE Report →
                </button>
              )}
            </>
          ) : (
            <div className="text-sm text-gray-400">Not linked</div>
          )}
        </div>

        {/* Vitality (PULSE) */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-medium text-gray-600">
              Vitality (PULSE)
            </span>
            {data.pulse && <CheckCircle className="w-4 h-4 text-green-500" />}
          </div>
          {data.pulse ? (
            <>
              <div className="text-3xl font-bold text-gray-900">
                {data.pulse.vitality_score}/100
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {data.pulse.active_contributors} contributors
              </div>
              {onAuditClick && (
                <button
                  onClick={() => onAuditClick('pulse')}
                  className="text-xs text-blue-600 hover:underline mt-2 text-left"
                >
                  View PULSE Report →
                </button>
              )}
            </>
          ) : (
            <div className="text-sm text-gray-400">Not linked</div>
          )}
        </div>

        {/* Verified Revenue */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">💰</span>
            <span className="text-sm font-medium text-gray-600">
              Verified Revenue
            </span>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            ${(data.revenue_verified / 1000).toFixed(1)}k
          </div>
          <div className="text-sm text-gray-500 mt-1">On-chain verified</div>
        </div>
      </div>

      {/* Fabrknt Score */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 mb-1">Fabrknt Score</div>
            <div className="text-2xl font-bold text-gray-900">
              {data.fabrknt_score}/100
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">
              Composite: Growth + Vitality + Revenue
            </div>
            {onAuditClick && (
              <button
                onClick={() => onAuditClick('full')}
                className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1 mt-1"
              >
                Full Audit Report →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
