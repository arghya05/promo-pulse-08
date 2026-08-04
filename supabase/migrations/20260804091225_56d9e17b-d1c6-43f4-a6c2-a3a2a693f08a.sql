DELETE FROM public.supplier_orders;

INSERT INTO public.supplier_orders (
  supplier_id, product_sku, order_date, expected_delivery_date, actual_delivery_date,
  quantity, unit_cost, total_cost, status, on_time
)
SELECT
  s.id,
  p.product_sku,
  d.order_date,
  d.order_date + s.lead_time_days,
  CASE
    WHEN d.order_date + s.lead_time_days > CURRENT_DATE THEN NULL
    ELSE d.order_date + s.lead_time_days + late.days
  END,
  q.qty,
  round(p.cost::numeric, 2),
  round((q.qty * p.cost)::numeric, 2),
  CASE
    WHEN d.order_date + s.lead_time_days > CURRENT_DATE THEN 'In Transit'
    ELSE 'Delivered'
  END,
  CASE
    WHEN d.order_date + s.lead_time_days > CURRENT_DATE THEN NULL
    ELSE late.days <= 0
  END
FROM public.suppliers s
JOIN LATERAL (
  SELECT product_sku, cost, category
  FROM public.products
  WHERE (abs(hashtext(product_sku || s.id::text)) % 100) < 22
  ORDER BY product_sku
  LIMIT 14
) p ON true
CROSS JOIN LATERAL (
  SELECT (CURRENT_DATE - (g * 7) - (abs(hashtext(p.product_sku || s.id::text || g::text)) % 5)) AS order_date
  FROM generate_series(1, 52) g
  WHERE (abs(hashtext(p.product_sku || s.id::text || g::text || 'freq')) % 100)
        < (CASE WHEN p.category IN ('Produce','Dairy','Bakery','Meat','Seafood') THEN 70 ELSE 30 END)
) d
CROSS JOIN LATERAL (
  SELECT GREATEST(round((abs(hashtext(p.product_sku || s.id::text || d.order_date::text || 'qty')) % 700)
    * (CASE WHEN p.category IN ('Produce','Dairy','Bakery') THEN 1.6 ELSE 1.0 END))::int, 24) AS qty
) q
CROSS JOIN LATERAL (
  SELECT CASE
    WHEN (abs(hashtext(p.product_sku || s.id::text || d.order_date::text || 'late')) % 1000)
         < GREATEST(round((100 - COALESCE(s.reliability_score, 92)) * 10)::int, 20)
      THEN 1 + (abs(hashtext(p.product_sku || s.id::text || d.order_date::text || 'days')) % 6)
    ELSE 0
  END AS days
) late;

-- Keep purchase order delivery outcomes consistent with supplier reliability
UPDATE public.purchase_orders po
SET actual_delivery_date = CASE
      WHEN po.expected_delivery_date > CURRENT_DATE THEN NULL
      ELSE po.expected_delivery_date
           + (CASE WHEN (abs(hashtext(po.id::text || 'late')) % 100) < 12
                   THEN 1 + (abs(hashtext(po.id::text || 'd')) % 5) ELSE 0 END)
    END,
    status = CASE WHEN po.expected_delivery_date > CURRENT_DATE THEN 'In Transit' ELSE 'Received' END;