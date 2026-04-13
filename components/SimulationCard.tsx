'use client';

import Link from 'next/link';
import { Boxes, Eye, Heart, ChevronRight } from 'lucide-react';
import { Simulation } from '@/app/types/physics';

export default function SimulationCard({ sim }: { sim: Simulation }) {
  return (
    <div className="group bg-white rounded-[2.5rem] border border-slate-200 shadow-md overflow-hidden hover:shadow-2xl hover:shadow-blue-200/40 hover:-translate-y-2 transition-all duration-500 flex flex-col relative">
      <Link href={`/view/${sim.id}`} className="block aspect-[16/10] bg-slate-50 relative overflow-hidden">
        {sim.image_url ? (
          <img src={sim.image_url} alt={sim.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-200 bg-slate-50">
            <Boxes size={56} strokeWidth={1} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </Link>
      
      <div className="p-8 flex flex-col flex-grow">
        <Link href={`/view/${sim.id}`}>
          <h3 className="text-xl font-black text-slate-900 mb-3 group-hover:text-blue-600 transition-colors tracking-tight line-clamp-1">
            {sim.title}
          </h3>
        </Link>
        <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-8 font-medium h-10">{sim.description}</p>
        
        <div className="mt-auto pt-5 border-t border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-4 text-slate-400 text-[11px] font-black uppercase tracking-widest">
            <div className="flex items-center gap-1.5"><Eye size={14} /> {sim.view_count || 0}</div>
            <div className="flex items-center gap-1.5"><Heart size={14} className={sim.like_count > 0 ? "text-red-400 fill-red-400" : ""} /> {sim.like_count || 0}</div>
          </div>
          <Link href={`/view/${sim.id}`} className="flex items-center gap-2 py-2 px-4 bg-slate-50 rounded-xl hover:bg-blue-600 group/btn transition-all">
            <span className="text-[10px] font-black text-slate-900 group-hover:text-white transition-colors uppercase tracking-widest">Explore</span>
            <ChevronRight size={14} className="text-slate-400 group-hover:text-white transition-all" />
          </Link>
        </div>
      </div>
    </div>
  );
}