import { supabase, isSupabaseConfigured } from './supabaseClient';
import { mockEngine } from './mockEngine';

// Friendly error handler (Section 59)
function formatError(err) {
  if (!err) return 'An unexpected error occurred. Please try again.';
  const msg = err.message || String(err);
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('fetch')) {
    return 'Unable to connect to Sasyathra backend. Please check your network connection or Supabase settings.';
  }
  return msg;
}

export const sasyathraService = {
  isCloudConnected() {
    return isSupabaseConfigured && Boolean(supabase);
  },

  async getDemands() {
    if (this.isCloudConnected()) {
      try {
        const { data, error } = await supabase
          .from('demands')
          .select('*, contributions(*), processing_batches(*)')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to local engine:', err);
      }
    }
    return mockEngine.getDemands();
  },

  async getProcessingUnits() {
    if (this.isCloudConnected()) {
      try {
        const { data, error } = await supabase
          .from('processing_units')
          .select('*')
          .order('name');
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.warn('Supabase units fetch failed:', err);
      }
    }
    return mockEngine.getProcessingUnits();
  },

  async postDemand(payload) {
    if (this.isCloudConnected()) {
      try {
        const { data, error } = await supabase.rpc('post_demand', {
          p_buyer_id: payload.buyer_id || null,
          p_buyer_name: payload.buyer_name,
          p_product: payload.product,
          p_qty_kg: Number(payload.qty_kg),
          p_location: payload.location,
          p_district: payload.district || payload.location,
          p_required_date: payload.required_date,
          p_price_per_kg: Number(payload.price_per_kg),
          p_price_min: Number(payload.price_min || payload.price_per_kg),
          p_price_max: Number(payload.price_max || payload.price_per_kg),
          p_quality_requirements: payload.quality_requirements || null,
          p_notes: payload.notes || null
        });
        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase post_demand error:', err);
        throw new Error(formatError(err));
      }
    }
    return mockEngine.postDemand(payload);
  },

  async pledgeProduce(payload) {
    if (this.isCloudConnected()) {
      try {
        const { data, error } = await supabase.rpc('pledge_produce', {
          p_demand_id: payload.demand_id,
          p_farmer_id: payload.farmer_id || null,
          p_farmer_name: payload.farmer_name,
          p_village: payload.village,
          p_district: payload.district || payload.village,
          p_qty: Number(payload.qty_kg),
          p_harvest_date: payload.expected_harvest_date || null,
          p_moisture: payload.moisture_percent ? Number(payload.moisture_percent) : null,
          p_grade: payload.grade || 'Standard Grade',
          p_notes: payload.notes || null
        });
        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase pledge_produce error:', err);
        throw new Error(formatError(err));
      }
    }
    return mockEngine.pledgeProduce(payload);
  },

  async reportHarvest(payload) {
    if (this.isCloudConnected()) {
      try {
        const { data, error } = await supabase.rpc('report_harvest', {
          p_contribution_id: payload.contribution_id,
          p_harvest_date: payload.harvest_date,
          p_qty_kg: Number(payload.qty_kg),
          p_moisture_percent: payload.moisture_percent ? Number(payload.moisture_percent) : 13.5,
          p_grade: payload.grade || 'Grade A',
          p_notes: payload.notes || null
        });
        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase report_harvest error:', err);
        throw new Error(formatError(err));
      }
    }
    return mockEngine.reportHarvest(payload);
  },

  async requestPickup(payload) {
    if (this.isCloudConnected()) {
      try {
        const { data, error } = await supabase.rpc('request_pickup', {
          p_produce_lot_id: payload.produce_lot_id,
          p_pickup_location: payload.pickup_location,
          p_preferred_date: payload.preferred_date,
          p_notes: payload.notes || null
        });
        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase request_pickup error:', err);
        throw new Error(formatError(err));
      }
    }
    return mockEngine.requestPickup(payload);
  },

  async assignPickup(payload) {
    if (this.isCloudConnected()) {
      try {
        const { data, error } = await supabase.rpc('assign_pickup', {
          p_pickup_request_id: payload.pickup_request_id,
          p_unit_id: payload.unit_id,
          p_scheduled_date: payload.scheduled_date,
          p_vehicle_number: payload.vehicle_number,
          p_driver_name: payload.driver_name,
          p_driver_phone: payload.driver_phone
        });
        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase assign_pickup error:', err);
        throw new Error(formatError(err));
      }
    }
    return mockEngine.assignPickup(payload);
  },

  async markPickedUp(payload) {
    if (this.isCloudConnected()) {
      try {
        const { data, error } = await supabase.rpc('mark_picked_up', {
          p_pickup_request_id: payload.pickup_request_id
        });
        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase mark_picked_up error:', err);
        throw new Error(formatError(err));
      }
    }
    return mockEngine.markPickedUp(payload);
  },

  async confirmReceived(payload) {
    if (this.isCloudConnected()) {
      try {
        const { data, error } = await supabase.rpc('confirm_received', {
          p_pickup_request_id: payload.pickup_request_id,
          p_received_qty_kg: Number(payload.received_qty_kg),
          p_received_date: payload.received_date,
          p_condition_note: payload.condition_note || ''
        });
        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase confirm_received error:', err);
        throw new Error(formatError(err));
      }
    }
    return mockEngine.confirmReceived(payload);
  },

  checkCapacity(unitId, date) {
    // Both local and cloud use capacity check
    return mockEngine.checkCapacity(unitId, date);
  },

  async scheduleProcessing(payload) {
    if (this.isCloudConnected()) {
      try {
        const { data, error } = await supabase.rpc('schedule_processing', {
          p_demand_id: payload.demand_id,
          p_unit_id: payload.unit_id,
          p_processing_date: payload.processing_date,
          p_lot_ids: payload.lot_ids,
          p_operator_name: payload.operator_name,
          p_notes: payload.notes || null
        });
        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase schedule_processing error:', err);
        throw new Error(formatError(err));
      }
    }
    return mockEngine.scheduleProcessingBatch(payload);
  },

  async updateBatchStatus(payload) {
    if (this.isCloudConnected()) {
      try {
        const { data, error } = await supabase.rpc('update_batch_status', {
          p_batch_id: payload.batch_id,
          p_new_status: payload.new_status,
          p_output_qty_kg: payload.output_qty_kg ? Number(payload.output_qty_kg) : null,
          p_operator_name: payload.operator_name || null,
          p_notes: payload.notes || null
        });
        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase update_batch_status error:', err);
        throw new Error(formatError(err));
      }
    }
    return mockEngine.updateBatchStatus(payload);
  },

  async addBatchVerification(payload) {
    if (this.isCloudConnected()) {
      try {
        const { data, error } = await supabase.rpc('add_batch_verification', {
          p_batch_id: payload.batch_id,
          p_tier: payload.tier,
          p_status: payload.status,
          p_note: payload.note || null,
          p_evidence_url: payload.evidence_url || null,
          p_verified_by: payload.verified_by
        });
        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase add_batch_verification error:', err);
        throw new Error(formatError(err));
      }
    }
    return mockEngine.addBatchVerification(payload);
  },

  async markDelivered(payload) {
    if (this.isCloudConnected()) {
      try {
        const { data, error } = await supabase.rpc('mark_delivered', {
          p_demand_id: payload.demand_id,
          p_batch_id: payload.batch_id || null,
          p_delivered_qty: Number(payload.delivered_qty),
          p_receiver_name: payload.receiver_name,
          p_notes: payload.notes || null
        });
        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase mark_delivered error:', err);
        throw new Error(formatError(err));
      }
    }
    return mockEngine.markDelivered(payload);
  },

  async getBatchTrace(batchCode) {
    if (!batchCode) return { found: false };
    if (this.isCloudConnected()) {
      try {
        const { data, error } = await supabase.rpc('get_batch_trace', {
          p_batch_code: batchCode.trim()
        });
        if (error) throw error;
        if (data && data.found) return data;
      } catch (err) {
        console.warn('Supabase get_batch_trace fallback:', err);
      }
    }
    return mockEngine.getBatchTrace(batchCode);
  },

  async getContributions(farmerId = null) {
    if (this.isCloudConnected()) {
      try {
        let query = supabase.from('contributions').select('*, demands(*)').order('created_at', { ascending: false });
        if (farmerId) query = query.eq('farmer_id', farmerId);
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.warn('Supabase contributions fetch fallback:', err);
      }
    }
    return mockEngine.getContributions(farmerId);
  },

  async getProduceLots(farmerId = null) {
    if (this.isCloudConnected()) {
      try {
        let query = supabase.from('produce_lots').select('*, demands(*)').order('created_at', { ascending: false });
        if (farmerId) query = query.eq('farmer_id', farmerId);
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.warn('Supabase produce lots fetch fallback:', err);
      }
    }
    return mockEngine.getProduceLots(farmerId);
  },

  async getPickupRequests(unitId = null, farmerId = null) {
    if (this.isCloudConnected()) {
      try {
        let query = supabase.from('pickup_requests').select('*, produce_lots(*), demands(*), processing_units(*)').order('created_at', { ascending: false });
        if (farmerId) query = query.eq('farmer_id', farmerId);
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.warn('Supabase pickup requests fetch fallback:', err);
      }
    }
    return mockEngine.getPickupRequests(unitId, farmerId);
  },

  async getProcessingBatches(unitId = null) {
    if (this.isCloudConnected()) {
      try {
        let query = supabase.from('processing_batches').select('*, demands(*), processing_units(*), batch_items(*), batch_verifications(*)').order('created_at', { ascending: false });
        if (unitId) query = query.eq('processing_unit_id', unitId);
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.warn('Supabase batches fetch fallback:', err);
      }
    }
    return mockEngine.getProcessingBatches(unitId);
  },

  async getLedgerEntries(farmerId = null) {
    if (this.isCloudConnected()) {
      try {
        let query = supabase.from('ledger_entries').select('*, demands(*)').order('created_at', { ascending: false });
        if (farmerId) query = query.eq('farmer_id', farmerId);
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.warn('Supabase ledger fetch fallback:', err);
      }
    }
    return mockEngine.getLedgerEntries(farmerId);
  },

  async getTraceEvents(demandId = null, batchId = null) {
    if (this.isCloudConnected()) {
      try {
        let query = supabase.from('trace_events').select('*').order('created_at', { ascending: true });
        if (demandId) query = query.eq('demand_id', demandId);
        if (batchId) query = query.eq('batch_id', batchId);
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.warn('Supabase trace events fetch fallback:', err);
      }
    }
    return mockEngine.getTraceEvents(demandId, batchId);
  },

  subscribeToChanges(callback) {
    if (this.isCloudConnected()) {
      const channel = supabase
        .channel('sasyathra-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'demands' }, callback)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions' }, callback)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'produce_lots' }, callback)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pickup_requests' }, callback)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'processing_batches' }, callback)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ledger_entries' }, callback)
        .subscribe();

      const unsubscribeLocal = mockEngine.subscribe(callback);
      return () => {
        supabase.removeChannel(channel);
        unsubscribeLocal();
      };
    }
    return mockEngine.subscribe(callback);
  },

  resetDemoData() {
    return mockEngine.resetDemoData();
  }
};
