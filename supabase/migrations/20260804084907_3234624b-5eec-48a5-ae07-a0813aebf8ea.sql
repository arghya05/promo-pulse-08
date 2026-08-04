-- 1) Shift all historical fact data forward by 83 weeks (581 days) so the demo
-- dataset runs Aug 2025 -> Aug 2026 while preserving day-of-week seasonality.
UPDATE public.transactions SET transaction_date = transaction_date + interval '581 days';
UPDATE public.orders SET order_date = order_date + interval '581 days';
UPDATE public.invoices SET invoice_date = invoice_date + interval '581 days';
UPDATE public.returns SET return_date = return_date + interval '581 days' WHERE return_date < '2025-06-01';
UPDATE public.customer_journey SET touchpoint_date = touchpoint_date + interval '581 days' WHERE touchpoint_date < '2025-06-01';
UPDATE public.promotions SET start_date = start_date + 581, end_date = end_date + 581;
UPDATE public.discounts SET start_date = start_date + 581, end_date = end_date + 581;
UPDATE public.store_performance SET metric_date = metric_date + 581;
UPDATE public.kpi_measures SET measure_date = measure_date + 581;
UPDATE public.markdowns SET effective_date = effective_date + 581, end_date = end_date + 581;
UPDATE public.price_change_history SET change_date = change_date + interval '581 days' WHERE change_date < '2025-06-01';
UPDATE public.supplier_orders SET order_date = order_date + 581, expected_delivery_date = expected_delivery_date + 581, actual_delivery_date = actual_delivery_date + 581;
UPDATE public.purchase_orders SET order_date = order_date + 581, expected_delivery_date = expected_delivery_date + 581, actual_delivery_date = actual_delivery_date + 581;
UPDATE public.forecast_accuracy_tracking SET tracking_date = tracking_date + 581;
UPDATE public.competitor_data SET observation_date = observation_date + 581;
UPDATE public.competitor_prices SET observation_date = '2026-08-03';
UPDATE public.stock_age_tracking SET tracking_date = '2026-08-03';
UPDATE public.inventory_levels SET last_restocked = last_restocked + 240;
UPDATE public.planograms SET effective_date = effective_date + 581;
UPDATE public.demand_forecasts SET forecast_date = forecast_date + 400, forecast_period_start = forecast_period_start + 400, forecast_period_end = forecast_period_end + 400;

-- 2) Rebuild the retail calendar (4-5-4 style) for FY2025-FY2026
DELETE FROM public.time_dimension;
INSERT INTO public.time_dimension (date_value, year, quarter, quarter_name, period, period_name, week, week_name, day_of_week, day_name, day_type, fiscal_year, fiscal_quarter, is_holiday)
SELECT d::date,
  EXTRACT(year FROM d)::int,
  EXTRACT(quarter FROM d)::int,
  'Q'||EXTRACT(quarter FROM d)::int,
  EXTRACT(month FROM d)::int,
  'P'||lpad(EXTRACT(month FROM d)::text,2,'0'),
  EXTRACT(week FROM d)::int,
  'W'||lpad(EXTRACT(week FROM d)::text,2,'0'),
  EXTRACT(isodow FROM d)::int,
  trim(to_char(d,'Day')),
  CASE WHEN EXTRACT(isodow FROM d) IN (6,7) THEN 'Weekend' ELSE 'Weekday' END,
  CASE WHEN EXTRACT(month FROM d) >= 2 THEN EXTRACT(year FROM d)::int + 1 ELSE EXTRACT(year FROM d)::int END,
  ((EXTRACT(month FROM d)::int + 10) % 12) / 3 + 1,
  false
FROM generate_series('2025-01-01'::date, '2026-12-31'::date, interval '1 day') d;

-- 3) US grocery-relevant demand events
DELETE FROM public.holidays;
INSERT INTO public.holidays (holiday_date, holiday_name, holiday_type, country) VALUES
('2025-09-01','Labor Day','Federal Holiday','USA'),
('2025-10-31','Halloween','Seasonal Event','USA'),
('2025-11-27','Thanksgiving','Federal Holiday','USA'),
('2025-11-28','Black Friday','Retail Event','USA'),
('2025-12-24','Christmas Eve','Seasonal Event','USA'),
('2025-12-25','Christmas Day','Federal Holiday','USA'),
('2025-12-31','New Years Eve','Seasonal Event','USA'),
('2026-01-01','New Years Day','Federal Holiday','USA'),
('2026-02-08','Super Bowl Sunday','Retail Event','USA'),
('2026-02-14','Valentines Day','Seasonal Event','USA'),
('2026-03-17','St Patricks Day','Seasonal Event','USA'),
('2026-04-05','Easter Sunday','Seasonal Event','USA'),
('2026-05-05','Cinco de Mayo','Seasonal Event','USA'),
('2026-05-10','Mothers Day','Seasonal Event','USA'),
('2026-05-25','Memorial Day','Federal Holiday','USA'),
('2026-06-21','Fathers Day','Seasonal Event','USA'),
('2026-07-04','Independence Day','Federal Holiday','USA'),
('2026-08-15','Back to School Peak','Retail Event','USA'),
('2026-09-07','Labor Day','Federal Holiday','USA'),
('2026-10-31','Halloween','Seasonal Event','USA'),
('2026-11-26','Thanksgiving','Federal Holiday','USA'),
('2026-11-27','Black Friday','Retail Event','USA'),
('2026-12-25','Christmas Day','Federal Holiday','USA');

UPDATE public.time_dimension t SET is_holiday = true, holiday_name = h.holiday_name
FROM public.holidays h WHERE h.holiday_date = t.date_value;