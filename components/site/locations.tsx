"use client";

import { Icon } from "@/components/icon";
import { mapsDir, mapsView, telHref } from "@/lib/format";
import { useJumpToHash } from "@/lib/site/jump-to-hash";
import { useData } from "@/lib/store";

// site.js locations(): the store chips, the counters list and one section per store, from this browser's copy of the
// data (the seed until hydration).

export function BranchJumps() {
  return useData().branches.map((b) => (
    <li key={b.id}>
      <a className="chip" href={"#" + b.id}>
        <Icon name="pin" />
        {b.name}
      </a>
    </li>
  ));
}

export function StoreServices() {
  return (useData().storeServices || []).map((s, i) => (
    <li key={i}>
      <Icon name="check" />
      <span>{s}</span>
    </li>
  ));
}

export function LocationsList() {
  const d = useData();
  const settings = d.settings;
  useJumpToHash();
  return d.branches.map((b) => {
    const services = b.services || [];
    return (
      <section className="branch" id={b.id} aria-labelledby={b.id + "-title"} key={b.id}>
        <div className="container">
          <div className="split split-top">
            <div>
              <p className="eyebrow">Store</p>
              <h2 id={b.id + "-title"}>{b.name}</h2>
              <address>{b.address}</address>
              <span className="store-km" data-km={b.id} />
              {b.plusCode ? <p className="plus-code">{"Plus code " + b.plusCode}</p> : null}
              {services.length ? (
                <>
                  <h3 className="visually-hidden">At this store</h3>
                  <div className="cluster services">
                    {services.map((s, i) => (
                      <span className="badge badge-green badge-plain" key={i}>
                        {s}
                      </span>
                    ))}
                  </div>
                </>
              ) : null}
              <ul className="contact-list">
                {b.phone ? (
                  <li>
                    <Icon name="phone" />
                    <a className="num" href={telHref(b.phone)}>
                      {b.phone}
                    </a>
                  </li>
                ) : null}
                {settings.whatsappChannel ? (
                  <li>
                    <Icon name="bell" />
                    <a href={settings.whatsappChannel} target="_blank" rel="noopener">
                      Deals on our WhatsApp channel<span className="visually-hidden"> (opens in a new tab)</span>
                    </a>
                  </li>
                ) : null}
              </ul>
              <div className="actions">
                <a className="btn btn-sign" href={mapsDir(b)} target="_blank" rel="noopener">
                  <Icon name="pin" />
                  Directions<span className="visually-hidden">{" to " + b.name + " (opens Google Maps in a new tab)"}</span>
                </a>
                <a className="btn btn-outline" href={mapsView(b)} target="_blank" rel="noopener">
                  View on Google Maps<span className="visually-hidden"> (opens in a new tab)</span>
                </a>
              </div>
            </div>
            <div className="card hours-card">
              <h3>Opening hours</h3>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Days</th>
                    <th scope="col">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {(b.hours || []).map((r, i) => (
                    <tr key={i}>
                      <td>{r[0]}</td>
                      <td>{r[1]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <span className="source-line">Public holiday hours may differ.</span>
            </div>
          </div>
        </div>
      </section>
    );
  });
}
